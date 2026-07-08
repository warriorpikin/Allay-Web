import { query } from '../config/database.js'

// Kept to a small number of concurrent queries deliberately — the connection pool caps at
// 10 clients (config/database.js), so fanning out one query per metric risks pool exhaustion
// and connection timeouts under real (non-local) DB latency. Related counts are combined with
// FILTER/subqueries instead of Promise.all-ing a query per number.
export async function getDashboardSummary() {
  const [
    bookingCounts,
    otherCounts,
    recentBookingsResult,
    recentWaitlistResult,
    popularServicesResult,
    settingsResult,
  ] = await Promise.all([
    query(`
      SELECT
        count(*) FILTER (WHERE appointment_date = CURRENT_DATE AND status <> 'cancelled')::int AS today,
        count(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND status IN ('pending', 'confirmed'))::int AS upcoming,
        count(*) FILTER (WHERE status = 'pending')::int AS pending,
        count(*) FILTER (WHERE status = 'confirmed')::int AS confirmed
      FROM bookings
    `),
    query(`
      SELECT
        (SELECT count(*) FROM waitlist_entries)::int AS waitlist_total,
        (SELECT count(*) FROM customers)::int AS customer_total,
        (SELECT count(*) FROM services WHERE is_active = TRUE)::int AS active_services
    `),
    query(`
      SELECT id, booking_reference AS "bookingReference", customer_name AS "customerName", status,
        appointment_date AS "appointmentDate", start_time AS "startTime",
        total_amount AS "totalAmount", payment_status AS "paymentStatus", created_at AS "createdAt"
      FROM bookings ORDER BY created_at DESC LIMIT 5
    `),
    query('SELECT id, email, created_at AS "createdAt" FROM waitlist_entries ORDER BY created_at DESC LIMIT 5'),
    query(`
      SELECT s.name, count(*)::int AS count
      FROM booking_services bs
      JOIN services s ON s.id = bs.service_id
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 5
    `),
    query("SELECT key, value FROM settings WHERE key IN ('launch', 'payment')"),
  ])

  const settingsByKey = Object.fromEntries(settingsResult.rows.map((row) => [row.key, row.value]))
  const paymentSetting = settingsByKey.payment
  const revenueTrackingActive = Boolean(paymentSetting?.online_enabled) && paymentSetting?.gateway && paymentSetting.gateway !== 'none'

  let revenue = {
    trackingActive: false,
    message: 'Revenue tracking will activate once payment confirmation is connected.',
  }

  if (revenueTrackingActive) {
    const revenueResult = await query(`
      SELECT
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS confirmed,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'unpaid'), 0)::numeric AS unpaid
      FROM bookings WHERE status <> 'cancelled'
    `)
    revenue = {
      trackingActive: true,
      confirmedTotal: Number(revenueResult.rows[0].confirmed),
      unpaidTotal: Number(revenueResult.rows[0].unpaid),
    }
  }

  const counts = otherCounts.rows[0]
  return {
    bookings: {
      today: bookingCounts.rows[0].today,
      upcoming: bookingCounts.rows[0].upcoming,
      pending: bookingCounts.rows[0].pending,
      confirmed: bookingCounts.rows[0].confirmed,
    },
    waitlist: {
      total: counts.waitlist_total,
      recent: recentWaitlistResult.rows,
    },
    customers: { total: counts.customer_total },
    services: { active: counts.active_services },
    siteMode: settingsByKey.launch?.mode === 'live' ? 'live' : 'prelaunch',
    recentBookings: recentBookingsResult.rows,
    popularServices: popularServicesResult.rows,
    revenue,
  }
}
