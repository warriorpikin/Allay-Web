import app from './app.js'
import { pool } from './config/database.js'
import { env } from './config/env.js'

const server = app.listen(env.PORT, () => {
  console.log(`Allay House API listening on http://localhost:${env.PORT}`)
})

async function shutdown(signal) {
  console.log(`${signal} received. Closing gracefully.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

