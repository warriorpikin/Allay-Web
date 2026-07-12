import { z } from 'zod'
import { query } from '../config/database.js'

const listSchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

function mapUser(row) {
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
  }
}

export async function listAdminUsers(req, res, next) {
  try {
    const parsed = listSchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ message: 'Enter valid user filters.' })
    const { search, page, limit } = parsed.data
    const offset = (page - 1) * limit
    const searchValue = `%${search.toLowerCase()}%`
    const where = search
      ? `WHERE c.password_hash IS NOT NULL AND (LOWER(c.full_name) LIKE $1 OR LOWER(c.email) LIKE $1 OR LOWER(COALESCE(c.phone, '')) LIKE $1)`
      : 'WHERE c.password_hash IS NOT NULL'
    const params = search ? [searchValue, limit, offset] : [limit, offset]
    const countParams = search ? [searchValue] : []

    const [users, count] = await Promise.all([
      query(
        `SELECT c.id, c.full_name, c.email, c.phone, c.status, c.created_at, c.last_login_at,
          COUNT(DISTINCT b.id)::int AS booking_count,
          MAX(b.created_at) AS latest_booking_at
         FROM customers c
         LEFT JOIN bookings b ON b.customer_id = c.id
         ${where}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`,
        params,
      ),
      query(`SELECT COUNT(*)::int AS total FROM customers c ${where}`, countParams),
    ])

    return res.json({
      users: users.rows.map(mapUser),
      pagination: { page, limit, total: count.rows[0]?.total || 0 },
    })
  } catch (error) {
    return next(error)
  }
}
