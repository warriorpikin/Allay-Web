import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsDir = path.resolve(__dirname, '../db/seeds')

async function run() {
  const files = (await readdir(seedsDir)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(path.join(seedsDir, file), 'utf8')
    console.log(`Running seed ${file}`)
    await pool.query(sql)
  }
  console.log('Seeds complete.')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
