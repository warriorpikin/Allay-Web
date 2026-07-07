import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(__dirname, '../db/migrations')

async function run() {
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    console.log(`Running migration ${file}`)
    await pool.query(sql)
  }
  console.log('Migrations complete.')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
