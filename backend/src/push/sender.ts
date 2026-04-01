import { webpush } from '../lib/webpush.js'
import { logger } from '../lib/logger.js'
import type { NotificationPayload } from '../types/index.js'

interface Subscription {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendNotification(
  subscription: Subscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    logger.info('Push notification sent', { endpoint: subscription.endpoint.slice(0, 50) })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      // Subscription expired/invalid — caller should delete it
      throw Object.assign(new Error('Subscription expired'), { expired: true })
    }
    logger.error('Failed to send push notification', err)
    throw err
  }
}
