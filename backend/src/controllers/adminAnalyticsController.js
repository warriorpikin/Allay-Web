import { getAnalyticsOverview, getAnalyticsStatus, runAnalyticsDiagnosticReport } from '../services/analyticsService.js'

export async function getStatus(req, res, next) {
  try {
    return res.json(getAnalyticsStatus())
  } catch (error) {
    return next(error)
  }
}

export async function getOverview(req, res, next) {
  try {
    const report = await getAnalyticsOverview(req.query)
    return res.json(report)
  } catch (error) {
    return next(error)
  }
}

export async function getDiagnostics(req, res, next) {
  try {
    const report = await runAnalyticsDiagnosticReport()
    return res.json(report)
  } catch (error) {
    return next(error)
  }
}
