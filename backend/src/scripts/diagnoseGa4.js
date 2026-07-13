import { runAnalyticsDiagnosticReport } from '../services/analyticsService.js'

const result = await runAnalyticsDiagnosticReport()

console.log(JSON.stringify(result, null, 2))

if (!result.success) process.exitCode = 1
