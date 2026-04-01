import './config.js' // Validates env vars at startup — must be first
import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { startScheduler } from './jobs/scheduler.js'
import { logger } from './lib/logger.js'
import { config } from './config.js'

const app = createApp()
const port = parseInt(config.PORT)

startScheduler()

serve({ fetch: app.fetch, port }, () => {
  logger.info(`Backend running on port ${port}`)
})
