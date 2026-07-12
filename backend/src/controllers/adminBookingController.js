import { z } from 'zod'
import { query } from '../config/database.js'

const statusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']) })
const paymentStatusSchema = z.object({ paymentStatus: z.enum(['unpaid', 'paid', 'failed', 'refunded']) })

export async function listAdminBookings(req, res, next) {
  try {
    const result = await query(
      `SELECT b.id, b.booking_reference AS "bookingReference", b.customer_name AS "customerName", b.customer_email AS "customerEmail",
        b.customer_phone AS "customerPhone", b.status, b.payment_status AS "paymentStatus", b.appointment_date AS "appointmentDate",
        b.start_time AS "startTime", b.end_time AS "endTime", b.total_duration_minutes AS "totalDurationMinutes",
        b.subtotal, b.discount_amount AS "discountAmount", b.total_amount AS "totalAmount", b.customer_note AS "customerNote",
        b.admin_note AS "adminNote", b.updated_at AS "updatedAt", b.created_at AS "createdAt",
        COALESCE(STRING_AGG(bs.service_name, ', ' ORDER BY bs.created_at ASC), '') AS "serviceNames"
       FROM bookings b
       LEFT JOIN booking_services bs ON bs.booking_id = b.id
       GROUP BY b.id
       ORDER BY b.appointment_date DESC, b.start_time DESC
       LIMIT 200`,
    )
    res.json({ bookings: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function getAdminBooking(req, res, next) {
  try {
    const booking = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id])
    if (!booking.rows[0]) return res.status(404).json({ message: 'Booking not found.' })
    const services = await query('SELECT * FROM booking_services WHERE booking_id = $1 ORDER BY created_at ASC', [req.params.id])
    return res.json({ booking: booking.rows[0], services: services.rows })
  } catch (error) {
    return next(error)
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const parsed = statusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid booking status.' })
    const result = await query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [parsed.data.status, req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Booking not found.' })
    return res.json({ booking: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}

export async function updateBookingPaymentStatus(req, res, next) {
  try {
    const parsed = paymentStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid payment status.' })
    const result = await query('UPDATE bookings SET payment_status = $1 WHERE id = $2 RETURNING *', [parsed.data.paymentStatus, req.params.id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Booking not found.' })
    return res.json({ booking: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}
