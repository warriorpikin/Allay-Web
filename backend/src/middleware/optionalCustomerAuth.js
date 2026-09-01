import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// Booking is intentionally open to guests. A valid customer token only links
// the request to an existing account; a missing or expired token never blocks
// a guest from continuing.
export function optionalCustomerAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return next()

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    if (payload.type === 'customer' && payload.sub) req.customerId = payload.sub
  } catch {
    // Treat invalid or expired customer credentials as a guest request.
  }

  return next()
}
