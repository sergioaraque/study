import { Query } from 'node-appwrite'
import { databases } from '../lib/appwrite.js'
import { sendNotification } from '../push/sender.js'
import { pecReminderPayload } from '../push/templates.js'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import type { ReminderDays } from '../types/index.js'

export async function runPecReminders(): Promise<void> {
  logger.info('Running PEC reminder job')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Fetch all PECs that are not yet delivered and have a due_date
    const pecs = await databases.listDocuments(
      config.APPWRITE_DATABASE_ID,
      config.COL_PECS,
      [
        Query.notEqual('status', 'entregada'),
        Query.notEqual('status', 'calificada'),
        Query.isNotNull('due_date'),
        Query.limit(200),
      ]
    )

    for (const pec of pecs.documents) {
      const dueDate = new Date(pec.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.round((dueDate.getTime() - today.getTime()) / 86400000)

      const reminderDays: ReminderDays = pec.reminder_days
        ? (JSON.parse(pec.reminder_days) as ReminderDays)
        : []

      if (!reminderDays.includes(daysLeft)) continue

      // Avoid duplicate reminders on the same day
      if (pec.last_reminder_sent) {
        const lastSent = new Date(pec.last_reminder_sent)
        lastSent.setHours(0, 0, 0, 0)
        if (lastSent.getTime() === today.getTime()) continue
      }

      // Fetch subscriptions for this user
      const subs = await databases.listDocuments(
        config.APPWRITE_DATABASE_ID,
        config.COL_PUSH_SUBSCRIPTIONS,
        [Query.equal('user_id', pec.user_id), Query.limit(10)]
      )

      const payload = pecReminderPayload(pec.title, pec.subject_name ?? '', daysLeft)

      for (const sub of subs.documents) {
        try {
          await sendNotification({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload)
        } catch (err: unknown) {
          if ((err as { expired?: boolean }).expired) {
            await databases.deleteDocument(config.APPWRITE_DATABASE_ID, config.COL_PUSH_SUBSCRIPTIONS, sub.$id)
          }
        }
      }

      // Mark last reminder sent
      await databases.updateDocument(config.APPWRITE_DATABASE_ID, config.COL_PECS, pec.$id, {
        last_reminder_sent: new Date().toISOString(),
      })
    }
  } catch (err) {
    logger.error('PEC reminder job failed', err)
  }
}
