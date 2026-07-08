import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { query } from '../config/database.js'
import { env } from '../config/env.js'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' })

    const email = parsed.data.email.toLowerCase()
    const result = await query('SELECT id, name, email, password_hash, role FROM admins WHERE LOWER(email) = $1 LIMIT 1', [email])
    const admin = result.rows[0]
    const matches = admin ? await bcrypt.compare(parsed.data.password, admin.password_hash) : false
    if (!matches) return res.status(401).json({ message: 'Invalid admin email or password.' })

    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
    return res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } })
  } catch (error) {
    return next(error)
  }
}

export async function profile(req, res, next) {
  try {
    const result = await query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [req.admin.sub])
    if (!result.rows[0]) return res.status(404).json({ message: 'Admin account not found.' })
    return res.json({ admin: result.rows[0] })
  } catch (error) {
    return next(error)
  }
}
