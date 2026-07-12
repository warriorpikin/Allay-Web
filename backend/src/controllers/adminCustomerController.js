import { z } from 'zod'
import { query } from '../config/database.js'

const listSchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

function mapCustomer(row) {
  const bookingCount = Number(row.booking_count || 0)
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: row.status || 'active',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    hasBooked: bookingCount > 0,
    bookingCount,
    latestBookingAt: row.latest_booking_at,
    waitlistStatus: row.waitlist_status,
  }
}

export async function listAdminCustomers(req, res, next) {
  try {
    const parsed = listSchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid customer filters.' })
    const { search, page, limit } = parsed.data
    const offset = (page - 1) * limit
    const searchValue = `%${search.toLowerCase()}%`
    const where = search
      ? `WHERE LOWER(c.full_name) LIKE $1 OR LOWER(c.email) LIKE $1 OR LOWER(COALESCE(c.phone, '')) LIKE $1`
      : ''
    const params = search ? [searchValue, limit, offset] : [limit, offset]
    const countParams = search ? [searchValue] : []

    const [customers, count] = await Promise.all([
      query(
        `SELECT c.id, c.full_name, c.email, c.phone, c.status, c.created_at, c.last_login_at,
          COUNT(DISTINCT b.id)::int AS booking_count,
          MAX(b.created_at) AS latest_booking_at,
          MAX(w.status) AS waitlist_status
         FROM customers c
         LEFT JOIN bookings b ON b.customer_id = c.id
         LEFT JOIN waitlist_entries w ON LOWER(w.email) = LOWER(c.email)
         ${where}
         GROUP BY c.id
         HAVING COUNT(DISTINCT b.id) > 0
         ORDER BY c.created_at DESC
         LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`,
        params,
      ),
      query(`SELECT COUNT(DISTINCT c.id)::int AS total FROM customers c JOIN bookings b ON b.customer_id = c.id ${where}`, countParams),
    ])

    return res.json({
      customers: customers.rows.map(mapCustomer),
      pagination: { page, limit, total: count.rows[0]?.total || 0 },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getAdminCustomer(req, res, next) {
  try {
    const result = await query(
      `SELECT c.id, c.full_name, c.email, c.phone, c.status, c.created_at, c.last_login_at,
        COUNT(DISTINCT b.id)::int AS booking_count,
        MAX(b.created_at) AS latest_booking_at,
        MAX(w.status) AS waitlist_status
       FROM customers c
       LEFT JOIN bookings b ON b.customer_id = c.id
       LEFT JOIN waitlist_entries w ON LOWER(w.email) = LOWER(c.email)
       WHERE c.id = $1
       GROUP BY c.id
       HAVING COUNT(DISTINCT b.id) > 0`,
      [req.params.id],
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Customer not found.' })
    const bookings = await query(
      `SELECT id, booking_reference AS "bookingReference", status, payment_status AS "paymentStatus",
        appointment_date AS "appointmentDate", start_time AS "startTime", total_amount AS "totalAmount", created_at AS "createdAt"
       FROM bookings
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.params.id],
    )
    return res.json({ customer: mapCustomer(result.rows[0]), recentBookings: bookings.rows })
  } catch (error) {
    return next(error)
  }
}
