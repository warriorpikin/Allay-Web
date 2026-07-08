export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  console.error(error)
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code)) {
    return res.status(503).json({ message: 'Cannot connect to database. Check DATABASE_URL and database availability.' })
  }
  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'Something went wrong. Please try again.',
  })
}
