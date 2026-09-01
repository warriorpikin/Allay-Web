import { pool, query } from '../config/database.js'
import { checkAvailability } from './availabilityService.js'
import { markDiscountCodeUsed, validateDiscountCode } from './discountService.js'
import { getPublicSiteMode } from './settingsService.js'
import { addMinutesToTime } from '../utils/timeSlots.js'
import { generateBookingReference } from '../utils/bookingReference.js'
import { sendBookingEmails } from './emailService.js'
import { buildWhatsAppHandoff, hasVariableBookingPrice } from './whatsappService.js'

function candidateIdentifiers(selectedServices = []) {
  const values = selectedServices.flatMap((service) => [service.id, service.serviceId, service.slug]).filter(Boolean)
  return [...new Set(values)]
}

async function resolveServices(selectedServices = []) {
  const identifiers = candidateIdentifiers(selectedServices)
  if (!identifiers.length) return []

  const result = await query(
    `SELECT id, name, slug, duration_minutes, duration_label, price, price_from, price_to,
       price_is_from, price_unit_label, price_options, is_active, is_discount_eligible
     FROM services
     WHERE (id::text = ANY($1) OR slug = ANY($1))
       AND is_active = TRUE
       AND COALESCE(bookable, TRUE) = TRUE
     ORDER BY display_order ASC, name ASC`,
    [identifiers],
  )
  return result.rows
}

async function findOrCreateCustomer(client, { customerName, customerEmail, customerPhone }, authenticatedCustomerId = null) {
  if (authenticatedCustomerId) {
    const account = await client.query('SELECT id FROM customers WHERE id = $1 LIMIT 1', [authenticatedCustomerId])
    if (account.rows[0]) {
      await client.query('UPDATE customers SET full_name = $1, phone = $2 WHERE id = $3', [customerName, customerPhone, account.rows[0].id])
      return account.rows[0].id
    }
  }

  const existing = await client.query('SELECT id, password_hash FROM customers WHERE LOWER(email) = LOWER($1) ORDER BY created_at ASC LIMIT 1', [customerEmail])
  if (existing.rows[0]) {
    // Never let an unauthenticated guest silently rewrite a registered
    // customer's account profile. The booking itself still keeps the guest's
    // submitted name, email, and phone as an immutable snapshot.
    if (!existing.rows[0].password_hash) {
      await client.query('UPDATE customers SET full_name = $1, phone = $2 WHERE id = $3', [customerName, customerPhone, existing.rows[0].id])
    }
    return existing.rows[0].id
  }
  const created = await client.query(
    'INSERT INTO customers (full_name, email, phone) VALUES ($1, $2, $3) RETURNING id',
    [customerName, customerEmail, customerPhone],
  )
  return created.rows[0].id
}

export async function createBookingRequest(payload, { authenticatedCustomerId = null } = {}) {
  const siteMode = await getPublicSiteMode()
  if (siteMode.mode !== 'live') {
    const error = new Error('Booking is not live yet. Please join the private waitlist for launch access.')
    error.status = 403
    throw error
  }

  const services = await resolveServices(payload.selectedServices)
  const unresolvedSelection = payload.selectedServices.some((selected) => {
    const identifiers = [selected.id, selected.serviceId, selected.slug].filter(Boolean).map(String)
    return !identifiers.length || !services.some((service) => identifiers.includes(String(service.id)) || identifiers.includes(service.slug))
  })
  if (!services.length || unresolvedSelection) {
    const error = new Error('One or more selected services are no longer available. Refresh the service menu and choose again.')
    error.status = 400
    throw error
  }

  const serviceIds = services.map((service) => service.id)
  const totalDurationMinutes = services.reduce((sum, service) => sum + Number(service.duration_minutes), 0)
  const subtotal = services.reduce((sum, service) => sum + Number(service.price), 0)
  const discount = payload.discountCode ? await validateDiscountCode({
    code: payload.discountCode,
    services,
    subtotal,
  }) : null
  const discountAmount = discount?.discountAmount || 0
  const totalAmount = Math.max(subtotal - discountAmount, 0)
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
  let createdBooking = null
  let bookingReference = ''
  let createdServices = services
  try {
    await client.query('BEGIN')
    const customerId = await findOrCreateCustomer(client, payload, authenticatedCustomerId)
    bookingReference = generateBookingReference()
    const endTime = addMinutesToTime(payload.preferredTime, totalDurationMinutes)
    const booking = await client.query(
      `INSERT INTO bookings (
        booking_reference, customer_id, customer_name, customer_email, customer_phone, status, payment_status,
        appointment_date, start_time, end_time, total_duration_minutes, subtotal, discount_amount, total_amount,
        discount_code_id, discount_code, customer_note
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', 'unpaid', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        discountAmount,
        totalAmount,
        discount?.id || null,
        discount?.code || null,
        payload.customerNote || null,
      ],
    )

    if (discount?.id) await markDiscountCodeUsed(client, discount.id)

    for (const service of services) {
      await client.query(
        `INSERT INTO booking_services (booking_id, service_id, service_name, price, duration_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.rows[0].id, service.id, service.name, service.price, service.duration_minutes],
      )
    }

    const whatsapp = buildWhatsAppHandoff({ booking: booking.rows[0], services })
    const updated = await client.query(
      'UPDATE bookings SET whatsapp_message = $1 WHERE id = $2 RETURNING *',
      [whatsapp.message, booking.rows[0].id],
    )

    await client.query('COMMIT')
    createdBooking = updated.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  const emailStatus = await sendBookingEmails({ booking: createdBooking, services: createdServices })
  const whatsapp = buildWhatsAppHandoff({ booking: createdBooking, services: createdServices })
  return {
    booking: createdBooking,
    services,
    bookingReference,
    emailStatus,
    whatsapp,
    confirmation: {
      reference: bookingReference,
      customer: {
        fullName: createdBooking.customer_name,
        email: createdBooking.customer_email,
        phone: createdBooking.customer_phone,
      },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        durationMinutes: Number(service.duration_minutes),
        durationLabel: service.duration_label || null,
        price: Number(service.price),
      })),
      date: createdBooking.appointment_date,
      time: String(createdBooking.start_time).slice(0, 5),
      totalDurationMinutes,
      subtotal: Number(createdBooking.subtotal),
      discountAmount: Number(createdBooking.discount_amount),
      totalAmount: Number(createdBooking.total_amount),
      priceIsEstimated: hasVariableBookingPrice(services),
      status: createdBooking.status,
      createdAt: createdBooking.created_at,
      emailSent: Boolean(emailStatus.customer),
      whatsapp,
    },
  }
}

export async function markWhatsAppHandoff(bookingReference) {
  const result = await query(
    `UPDATE bookings
     SET whatsapp_handoff_at = COALESCE(whatsapp_handoff_at, NOW())
     WHERE UPPER(booking_reference) = UPPER($1)
     RETURNING booking_reference AS "bookingReference", whatsapp_handoff_at AS "whatsappHandoffAt"`,
    [bookingReference],
  )
  return result.rows[0] || null
}
