import { query } from '../config/database.js'

// Source of truth for business metrics (customers, bookings, revenue) — kept
// entirely separate from analyticsService.js, which is 100% GA4. Never mix
// the two into the same card: a GA4 "new user" is a new website visitor: a
// "new customer" here is someone who placed their first qualifying booking.
const PRESET_DAYS = { '7d': 7, '28d': 28, '30d': 30, '90d': 90 }

function resolveRange(preset) {
  const days = PRESET_DAYS[preset] || 28
  const to = new Date()
  const from = new Date(to.getTime() - days * 86_400_000)
  const prevFrom = new Date(from.getTime() - days * 86_400_000)
  return { from, to, prevFrom }
}

function withComparison(current, previous) {
  const currentNum = Number(current || 0)
  const previousNum = Number(previous || 0)
  const changePercent = previousNum > 0 ? ((currentNum - previousNum) / previousNum) * 100 : (currentNum > 0 ? 100 : 0)
  return { current: currentNum, changePercent }
}

export async function getBusinessAnalyticsOverview({ preset } = {}) {
  const { from, to, prevFrom } = resolveRange(preset)

  const [summaryResult, customerResult, revenueByServiceResult, trendResult] = await Promise.all([
    query(
      `SELECT
         count(*) FILTER (WHERE created_at >= $1 AND created_at < $2 AND status <> 'cancelled')::int AS bookings_count,
         count(*) FILTER (WHERE created_at >= $1 AND created_at < $2 AND status = 'completed')::int AS completed_count,
         count(*) FILTER (WHERE created_at >= $1 AND created_at < $2 AND status = 'cancelled')::int AS cancelled_count,
         count(*) FILTER (WHERE created_at >= $1 AND created_at < $2 AND status = 'no_show')::int AS no_show_count,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= $1 AND created_at < $2 AND status <> 'cancelled'), 0)::numeric AS booking_revenue,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= $1 AND created_at < $2 AND payment_status = 'paid'), 0)::numeric AS collected_revenue,
         count(*) FILTER (WHERE created_at >= $3 AND created_at < $1 AND status <> 'cancelled')::int AS prev_bookings_count,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= $3 AND created_at < $1 AND status <> 'cancelled'), 0)::numeric AS prev_booking_revenue,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= $3 AND created_at < $1 AND payment_status = 'paid'), 0)::numeric AS prev_collected_revenue
       FROM bookings`,
      [from, to, prevFrom],
    ),
    query(
      `WITH first_booking AS (
         SELECT customer_id, MIN(created_at) AS first_at
         FROM bookings WHERE customer_id IS NOT NULL AND status <> 'cancelled'
         GROUP BY customer_id
       ),
       booking_counts AS (
         SELECT customer_id, count(*)::int AS bookings
         FROM bookings WHERE customer_id IS NOT NULL AND status <> 'cancelled'
         GROUP BY customer_id
       )
       SELECT
         (SELECT count(*) FROM customers)::int AS total_customers,
         (SELECT count(*) FROM first_booking WHERE first_at >= $1 AND first_at < $2)::int AS new_customers,
         (SELECT count(*) FROM first_booking WHERE first_at >= $3 AND first_at < $1)::int AS prev_new_customers,
         (SELECT count(*) FROM booking_counts WHERE bookings = 1)::int AS one_time_customers,
         (SELECT count(*) FROM booking_counts WHERE bookings BETWEEN 2 AND 3)::int AS occasional_customers,
         (SELECT count(*) FROM booking_counts WHERE bookings >= 4)::int AS frequent_customers,
         (SELECT count(DISTINCT b.customer_id) FROM bookings b
            WHERE b.customer_id IS NOT NULL AND b.status <> 'cancelled' AND b.created_at >= $1 AND b.created_at < $2
              AND b.customer_id IN (SELECT customer_id FROM booking_counts WHERE bookings > 1))::int AS returning_customers_in_period`,
      [from, to, prevFrom],
    ),
    query(
      `SELECT bs.service_name AS name, SUM(bs.price)::numeric AS revenue, count(*)::int AS bookings
       FROM booking_services bs
       JOIN bookings b ON b.id = bs.booking_id
       WHERE b.status <> 'cancelled' AND b.created_at >= $1 AND b.created_at < $2
       GROUP BY bs.service_name
       ORDER BY revenue DESC
       LIMIT 8`,
      [from, to],
    ),
    query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
         count(*)::int AS bookings,
         COALESCE(SUM(total_amount), 0)::numeric AS revenue
       FROM bookings
       WHERE status <> 'cancelled' AND created_at >= $1 AND created_at < $2
       GROUP BY date_trunc('day', created_at)
       ORDER BY date_trunc('day', created_at) ASC`,
      [from, to],
    ),
  ])

  const summary = summaryResult.rows[0]
  const customers = customerResult.rows[0]

  return {
    dateRange: { startDate: from.toISOString().slice(0, 10), endDate: to.toISOString().slice(0, 10) },
    overview: {
      totalBookings: withComparison(summary.bookings_count, summary.prev_bookings_count),
      completedBookings: { current: Number(summary.completed_count) },
      cancelledBookings: { current: Number(summary.cancelled_count) },
      noShowBookings: { current: Number(summary.no_show_count) },
      bookingRevenue: withComparison(summary.booking_revenue, summary.prev_booking_revenue),
      collectedRevenue: withComparison(summary.collected_revenue, summary.prev_collected_revenue),
      averageBookingValue: { current: summary.bookings_count > 0 ? Number(summary.booking_revenue) / Number(summary.bookings_count) : 0 },
      totalCustomers: { current: Number(customers.total_customers) },
      newCustomers: withComparison(customers.new_customers, customers.prev_new_customers),
      returningCustomers: { current: Number(customers.returning_customers_in_period) },
    },
    customerSegments: [
      { label: 'One-time', value: Number(customers.one_time_customers) },
      { label: 'Occasional (2-3 bookings)', value: Number(customers.occasional_customers) },
      { label: 'Frequent (4+ bookings)', value: Number(customers.frequent_customers) },
    ],
    revenueByService: revenueByServiceResult.rows.map((row) => ({ label: row.name, value: Number(row.revenue), bookings: row.bookings })),
    salesTrend: trendResult.rows.map((row) => ({ date: row.date, bookings: Number(row.bookings), revenue: Number(row.revenue) })),
    generatedAt: new Date().toISOString(),
  }
}
