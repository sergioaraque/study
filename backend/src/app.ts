import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { config } from './config.js'
import healthRoutes from './routes/health.js'
import pushRoutes from './routes/push.js'
import vapidRoutes from './routes/vapid.js'

export function createApp(): Hono {
  const app = new Hono()

  app.use('*', honoLogger())
  app.use(
    '*',
    cors({
      origin: config.FRONTEND_URL,
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    })
  )

  app.route('/health', healthRoutes)
  app.route('/push', pushRoutes)
  app.route('/vapid', vapidRoutes)

  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}
