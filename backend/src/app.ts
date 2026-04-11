import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { ZodError } from 'zod'
import { config } from './config.js'
import { AppError, createValidationError, ErrorCodes } from './errors.js'
import { logger } from './lib/logger.js'
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

  /**
   * Global error handler
   * Maneja diferentes tipos de errores de forma consistente
   */
  app.onError((err, c) => {
    let appError: AppError

    // Si es un error de validación Zod (del zValidator)
    if (err instanceof ZodError) {
      appError = createValidationError(err)
    }

    // Si es ya un AppError, usarlo directamente
    else if (err instanceof AppError) {
      appError = err
    }

    // Si es un error de Appwrite o desconocido, convertirlo a AppError
    else {
      // Log del error original para debugging
      logger.error('Unhandled error', {
        errorName: err.name,
        errorMessage: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: c.req.url,
        method: c.req.method,
      })

      // Crear AppError genérico
      appError = new AppError(
        ErrorCodes.INTERNAL_ERROR,
        undefined,
        process.env.NODE_ENV === 'development'
          ? { originalError: err instanceof Error ? err.message : String(err) }
          : undefined
      )
    }

    // Log del error de aplicación
    logger.warn('Request error', {
      code: appError.code,
      statusCode: appError.statusCode,
      message: appError.message,
      url: c.req.url,
      method: c.req.method,
    })

    return c.json(appError.toJSON(), appError.statusCode as any)
  })

  return app
}
