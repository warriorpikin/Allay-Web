import { z } from 'zod'
import { pool, query } from '../config/database.js'
import { sendConfirmedBookingEmail } from '../services/emailService.js'
import { addMinutesToTime, normalizeBookingTime } from '../utils/timeSlots.js'

const statusValues = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
const paymentStatusValues = ['unpaid', 'paid', 'failed', 'refunded']
const searchFields = ['any', 'reference', 'name', 'email', 'phone', 'service']

const listSchema = z.object({
  search: z.string().trim().max(180).optional().default(''),
  searchField: z.enum(searchFields).optional().default('any'),
  status: z.enum(['all', ...statusValues]).optional().default('all'),
  paymentStatus: z.enum(['all', ...paymentStatusValues]).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
})
const statusSchema = z.object({ status: z.enum(statusValues) })
const paymentStatusSchema = z.object({
  paymentStatus: z.enum(paymentStatusValues),
  amountPaid: z.coerce.number().min(0).optional(),
})
const confirmSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  totalAmount: z.coerce.number().min(0),
  amountPaid: z.coerce.number().min(0).optional(),
  markPaid: z.boolean().optional().default(true),
  adminNote: z.string().trim().max(2000).optional().default(''),
})

function bookingFilters(data) {
  const clauses = []
  const values = []
  const addValue = (value) => {
    values.push(value)
    return `$${values.length}`
  }

  if (data.status !== 'all') clauses.push(`b.status = ${addValue(data.status)}`)
  if (data.paymentStatus !== 'all') clauses.push(`b.payment_status = ${addValue(data.paymentStatus)}`)

  if (data.search) {
    const placeholder = addValue(`%${data.search}%`)
    const expressions = {
      reference: `b.booking_reference ILIKE ${placeholder}`,
      name: `b.customer_name ILIKE ${placeholder}`,
      email: `b.customer_email ILIKE ${placeholder}`,
      phone: `b.customer_phone ILIKE ${placeholder}`,
      service: `EXISTS (SELECT 1 FROM booking_services search_bs WHERE search_bs.booking_id = b.id AND search_bs.service_name ILIKE ${placeholder})`,
    }
    clauses.push(data.searchField === 'any'
      ? `(${expressions.reference} OR ${expressions.name} OR ${expressions.email} OR ${expressions.phone} OR ${expressions.service})`
      : expressions[data.searchField])
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values }
}

const bookingListSelect = `
  SELECT b.id, b.booking_reference AS "bookingReference", b.customer_name AS "customerName", b.customer_email AS "customerEmail",
    b.customer_phone AS "customerPhone", b.status, b.payment_status AS "paymentStatus", b.appointment_date AS "appointmentDate",
    b.start_time AS "startTime", b.end_time AS "endTime", b.total_duration_minutes AS "totalDurationMinutes",
    b.subtotal, b.discount_amount AS "discountAmount", b.total_amount AS "totalAmount", b.amount_paid AS "amountPaid",
    b.customer_note AS "customerNote", b.admin_note AS "adminNote", b.whatsapp_handoff_at AS "whatsappHandoffAt",
    b.confirmed_at AS "confirmedAt", b.updated_at AS "updatedAt", b.created_at AS "createdAt", COUNT(*) OVER()::int AS "totalCount",
    COALESCE((SELECT STRING_AGG(bs.service_name, ', ' ORDER BY bs.created_at ASC) FROM booking_services bs WHERE bs.booking_id = b.id), '') AS "serviceNames"
  FROM bookings b`

function parseListQuery(req, res) {
  const parsed = listSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Enter valid booking search filters.' })
    return null
  }
  return parsed.data
}

export async function listAdminBookings(req, res, next) {
  try {
    const data = parseListQuery(req, res)
    if (!data) return
    const filters = bookingFilters(data)
    const limitPlaceholder = `$${filters.values.length + 1}`
    const offsetPlaceholder = `$${filters.values.length + 2}`
    const result = await query(
      `${bookingListSelect}
       ${filters.where}
       ORDER BY CASE WHEN b.status = 'pending' THEN 0 ELSE 1 END, b.created_at DESC
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      [...filters.values, data.limit, (data.page - 1) * data.limit],
    )
    const total = Number(result.rows[0]?.totalCount || 0)
    const bookings = result.rows.map(({ totalCount: _totalCount, ...booking }) => booking)
    return res.json({
      bookings,
      pagination: { page: data.page, limit: data.limit, total, totalPages: Math.max(Math.ceil(total / data.limit), 1) },
    })
  } catch (error) {
    return next(error)
  }
}

function csvCell(value) {
  const raw = value == null ? '' : String(value)
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

function dateCell(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value || '').slice(0, 10)
}

export async function exportAdminBookings(req, res, next) {
  try {
    const data = parseListQuery(req, res)
    if (!data) return
    const filters = bookingFilters(data)
    const result = await query(
      `${bookingListSelect}
       ${filters.where}
       ORDER BY b.created_at DESC`,
      filters.values,
    )
    const headings = ['Booking code', 'Customer name', 'Email', 'Phone', 'Services', 'Appointment date', 'Start time', 'Estimated/final total', 'Amount paid', 'Status', 'Payment status', 'WhatsApp directed at', 'Created at']
    const rows = result.rows.map((booking) => [
      booking.bookingReference,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.serviceNames,
      dateCell(booking.appointmentDate),
      String(booking.startTime || '').slice(0, 5),
      booking.totalAmount,
      booking.amountPaid,
      booking.status,
      booking.paymentStatus,
      booking.whatsappHandoffAt || '',
      booking.createdAt || '',
    ])
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="allay-house-bookings-${stamp}.csv"`)
    return res.send(`\uFEFF${csv}`)
  } catch (error) {
    return next(error)
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

export async function confirmBooking(req, res, next) {
  const parsed = confirmSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid date, time, final price, and payment amount.' })
  const startTime = normalizeBookingTime(parsed.data.startTime)
  if (!startTime) return res.status(400).json({ message: 'Enter a valid confirmation time.' })
  if (parsed.data.markPaid && parsed.data.amountPaid != null && parsed.data.amountPaid < parsed.data.totalAmount) {
    return res.status(400).json({ message: 'A paid booking must record at least the full final total. Leave “Mark paid” off for a deposit or unpaid balance.' })
  }

  const client = await pool.connect()
  let booking
  let services
  try {
    await client.query('BEGIN')
    const existing = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!existing.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Booking not found.' })
    }

    const current = existing.rows[0]
    const totalAmount = parsed.data.totalAmount
    const amountPaid = parsed.data.amountPaid ?? (parsed.data.markPaid ? totalAmount : Number(current.amount_paid || 0))
    const result = await client.query(
      `UPDATE bookings SET
        appointment_date = $1, start_time = $2, end_time = $3, total_amount = $4, amount_paid = $5,
        payment_status = $6, status = 'confirmed', admin_note = NULLIF($7, ''),
        confirmed_at = NOW(), confirmed_by = $8
       WHERE id = $9
       RETURNING *`,
      [
        parsed.data.appointmentDate,
        startTime,
        addMinutesToTime(startTime, current.total_duration_minutes),
        totalAmount,
        amountPaid,
        parsed.data.markPaid ? 'paid' : 'unpaid',
        parsed.data.adminNote,
        req.admin.sub || req.admin.id || null,
        req.params.id,
      ],
    )
    booking = result.rows[0]
    const serviceResult = await client.query('SELECT * FROM booking_services WHERE booking_id = $1 ORDER BY created_at ASC', [req.params.id])
    services = serviceResult.rows
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }

  const emailStatus = await sendConfirmedBookingEmail({ booking, services })
  return res.json({ booking, services, emailStatus })
}

export async function updateBookingStatus(req, res, next) {
  try {
    const parsed = statusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid booking status.' })
    const adminId = req.admin.sub || req.admin.id || null
    const result = await query(
      `UPDATE bookings SET status = $1,
        confirmed_at = CASE WHEN $1 = 'confirmed' THEN COALESCE(confirmed_at, NOW()) ELSE confirmed_at END,
        confirmed_by = CASE WHEN $1 = 'confirmed' THEN COALESCE(confirmed_by, $2) ELSE confirmed_by END
       WHERE id = $3 RETURNING *`,
      [parsed.data.status, adminId, req.params.id],
    )
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
    const result = await query(
      `UPDATE bookings SET payment_status = $1,
        amount_paid = CASE
          WHEN $2::numeric IS NOT NULL THEN $2
          WHEN $1 = 'paid' THEN total_amount
          WHEN $1 IN ('unpaid', 'failed', 'refunded') THEN 0
          ELSE amount_paid
        END
       WHERE id = $3 RETURNING *`,
      [parsed.data.paymentStatus, parsed.data.amountPaid ?? null, req.params.id],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Booking not found.' })
    return res.json({ booking: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}
