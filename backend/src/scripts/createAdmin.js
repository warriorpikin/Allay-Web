import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool, query } from '../config/database.js'

const values = z.object({
  INITIAL_ADMIN_NAME: z.string().min(2),
  INITIAL_ADMIN_EMAIL: z.string().email(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12),
}).safeParse(process.env)

if (!values.success) {
  console.error('Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and a 12+ character INITIAL_ADMIN_PASSWORD in backend/.env.')
  process.exit(1)
}

try {
  const { INITIAL_ADMIN_NAME: name, INITIAL_ADMIN_EMAIL: email, INITIAL_ADMIN_PASSWORD: password } = values.data
  const passwordHash = await bcrypt.hash(password, 12)
  const result = await query(
    `INSERT INTO admins (name, email, password_hash, role)
     VALUES ($1, LOWER($2), $3, 'owner')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
     RETURNING id, name, email, role`,
    [name, email, passwordHash],
  )
  console.log(`Admin ready: ${result.rows[0].email}`)
} finally {
  await pool.end()
}

