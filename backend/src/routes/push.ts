import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Query } from 'node-appwrite'
import { databases } from '../lib/appwrite.js'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { AppError, ErrorCodes, createAppwriteError } from '../errors.js'

const push = new Hono()

const subscribeSchema = z.object({
  endpoint: z.string().url('El endpoint debe ser una URL válida'),
  p256dh: z.string().min(1, 'p256dh es requerido'),
  auth: z.string().min(1, 'auth es requerido'),
  userId: z.string().min(1, 'userId es requerido'),
  userAgent: z.string().optional(),
})

push.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  try {
    const body = c.req.valid('json')

    // Check if subscription already exists (by endpoint uniqueness)
    const existing = await databases.listDocuments(
      config.APPWRITE_DATABASE_ID,
      config.COL_PUSH_SUBSCRIPTIONS,
      [Query.equal('endpoint', body.endpoint)]
    )

    if (existing.total > 0) {
      return c.json({ ok: true, message: 'Already subscribed' })
    }

    await databases.createDocument(
      config.APPWRITE_DATABASE_ID,
      config.COL_PUSH_SUBSCRIPTIONS,
      'unique()',
      {
        user_id: body.userId,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        user_agent: body.userAgent ?? '',
        created_at_iso: new Date().toISOString(),
      }
    )

    logger.info('Push subscription created', { userId: body.userId })
    return c.json({ ok: true })
  } catch (error) {
    throw createAppwriteError(error)
  }
})

push.delete(
  '/unsubscribe',
  zValidator('json', z.object({ endpoint: z.string().url('El endpoint debe ser una URL válida') })),
  async (c) => {
    try {
      const { endpoint } = c.req.valid('json')

      const existing = await databases.listDocuments(
        config.APPWRITE_DATABASE_ID,
        config.COL_PUSH_SUBSCRIPTIONS,
        [Query.equal('endpoint', endpoint)]
      )

      for (const doc of existing.documents) {
        await databases.deleteDocument(
          config.APPWRITE_DATABASE_ID,
          config.COL_PUSH_SUBSCRIPTIONS,
          doc.$id
        )
      }

      logger.info('Push subscription removed', { endpoint: endpoint.slice(0, 50) })
      return c.json({ ok: true })
    } catch (error) {
      throw createAppwriteError(error)
    }
  }
)

export default push
