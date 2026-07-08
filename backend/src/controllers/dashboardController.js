import { getDashboardSummary } from '../services/dashboardService.js'

export async function getSummary(req, res, next) {
  try {
    const summary = await getDashboardSummary()
    return res.json(summary)
  } catch (error) {
    return next(error)
  }
}
