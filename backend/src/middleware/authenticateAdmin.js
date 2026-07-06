import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function authenticateAdmin(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Admin authentication required.' })

  try {
    req.admin = jwt.verify(token, env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
}

