export function notFound(req, res) {
  res.status(404).json({ success: false, code: 'ROUTE_NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  const status = error.status || 500
  const code = error.appCode || (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code) || error.severity ? 'DATABASE_ERROR' : status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR')
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[api-error] ${req.method} ${req.originalUrl} ${status} ${code}: ${error.message}`)
    if (status >= 500 && error.stack) console.error(error.stack)
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code)) {
    return res.status(503).json({ success: false, code: 'DATABASE_ERROR', message: 'Cannot connect to database. Check DATABASE_URL and database availability.' })
  }
  return res.status(status).json({
    success: false,
    code,
    message: error.status ? error.message : 'Something went wrong. Please try again.',
  })
}
