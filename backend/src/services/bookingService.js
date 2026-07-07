import { pool, query } from '../config/database.js'
import { checkAvailability } from './availabilityService.js'
import { addMinutesToTime } from '../utils/timeSlots.js'
import { generateBookingReference } from '../utils/bookingReference.js'

function candidateIdentifiers(selectedServices = []) {
  const values = selectedServices.flatMap((service) => [service.id, service.serviceId, service.slug]).filter(Boolean)
  return [...new Set(values)]
}

async function resolveServices(selectedServices = []) {
  const identifiers = candidateIdentifiers(selectedServices)
  if (!identifiers.length) return []

  const result = await query(
    `SELECT id, name, slug, duration_minutes, price, is_active
     FROM services
     WHERE (id::text = ANY($1) OR slug = ANY($1))
       AND is_active = TRUE
     ORDER BY display_order ASC, name ASC`,
    [identifiers],
  )
  return result.rows
}

async function findOrCreateCustomer(client, { customerName, customerEmail, customerPhone }) {
  const existing = await client.query('SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1', [customerEmail])
  if (existing.rows[0]) {
    await client.query('UPDATE customers SET full_name = $1, phone = $2 WHERE id = $3', [customerName, customerPhone, existing.rows[0].id])
    return existing.rows[0].id
  }
  const created = await client.query(
    'INSERT INTO customers (full_name, email, phone) VALUES ($1, $2, $3) RETURNING id',
    [customerName, customerEmail, customerPhone],
  )
  return created.rows[0].id
}

export async function createBookingRequest(payload) {
  const services = await resolveServices(payload.selectedServices)
  if (!services.length) {
    const error = new Error('Choose at least one active service.')
    error.status = 400
    throw error
  }

  const serviceIds = services.map((service) => service.id)
  const totalDurationMinutes = services.reduce((sum, service) => sum + Number(service.duration_minutes), 0)
  const subtotal = services.reduce((sum, service) => sum + Number(service.price), 0)
  const totalAmount = subtotal
  const availability = await checkAvailability({
    date: payload.appointmentDate,
    preferredTime: payload.preferredTime,
    serviceIds,
    totalDurationMinutes,
  })

  if (!availability.available) {
    const error = new Error(availability.message || 'This period is unavailable.')
    error.status = 409
    error.reason = availability.reason
    error.suggestedTimes = availability.suggestedTimes
    throw error
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const customerId = await findOrCreateCustomer(client, payload)
    const bookingReference = generateBookingReference()
    const endTime = addMinutesToTime(payload.preferredTime, totalDurationMinutes)
    const booking = await client.query(
      `INSERT INTO bookings (
        booking_reference, customer_id, customer_name, customer_email, customer_phone, status, payment_status,
        appointment_date, start_time, end_time, total_duration_minutes, subtotal, discount_amount, total_amount, customer_note
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', 'unpaid', $6, $7, $8, $9, $10, 0, $11, $12)
      RETURNING *`,
      [
        bookingReference,
        customerId,
        payload.customerName,
        payload.customerEmail,
        payload.customerPhone,
        payload.appointmentDate,
        payload.preferredTime,
        endTime,
        totalDurationMinutes,
        subtotal,
        totalAmount,
        payload.customerNote || null,
      ],
    )

    for (const service of services) {
      await client.query(
        `INSERT INTO booking_services (booking_id, service_id, service_name, price, duration_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.rows[0].id, service.id, service.name, service.price, service.duration_minutes],
      )
    }

    // TODO: trigger customer booking confirmation email after email automation is connected.
    // TODO: trigger admin booking notification email after email automation is connected.
    await client.query('COMMIT')
    return { booking: booking.rows[0], services, bookingReference }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
