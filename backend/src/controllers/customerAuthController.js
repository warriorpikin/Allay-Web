import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { query } from '../config/database.js'
import { env } from '../config/env.js'

const signupSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  password: z.string().min(8).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})

function mapCustomer(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    status: row.status || 'active',
  }
}

function signCustomerToken(customer) {
  return jwt.sign({ sub: customer.id, email: customer.email, type: 'customer' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

export async function signupCustomer(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Please enter valid account details.' })
    const email = parsed.data.email.toLowerCase()
    const existing = await query('SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1', [email])
    if (existing.rows[0]) return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' })
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const result = await query(
      `INSERT INTO customers (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone, created_at, last_login_at, status`,
      [parsed.data.fullName, email, parsed.data.phone, passwordHash],
    )
    const customer = mapCustomer(result.rows[0])
    return res.status(201).json({ token: signCustomerToken(customer), user: customer })
  } catch (error) {
    return next(error)
  }
}

export async function loginCustomer(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' })
    const email = parsed.data.email.toLowerCase()
    const result = await query('SELECT id, full_name, email, phone, password_hash, created_at, last_login_at, status FROM customers WHERE LOWER(email) = $1 LIMIT 1', [email])
    const customer = result.rows[0]
    const matches = customer?.password_hash ? await bcrypt.compare(parsed.data.password, customer.password_hash) : false
    if (!matches) return res.status(401).json({ message: 'Invalid email or password.' })
    const updated = await query(
      `UPDATE customers SET last_login_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, phone, created_at, last_login_at, status`,
      [customer.id],
    )
    const user = mapCustomer(updated.rows[0])
    return res.json({ token: signCustomerToken(user), user })
  } catch (error) {
    return next(error)
  }
}
