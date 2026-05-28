import { Query } from 'node-appwrite'
import { databases, listAllDocuments } from '../lib/appwrite.js'
import { sendNotification } from '../push/sender.js'
import { pecReminderPayload } from '../push/templates.js'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import type { ReminderDays } from '../types/index.js'

function parseReminderDays(raw: unknown, pecId: string): ReminderDays {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is number => Number.isInteger(v))
  } catch {
    logger.warn('Invalid reminder_days in PEC, skipping reminders for this entry', { pecId })
    return []
  }
}

export async function runPecReminders(): Promise<void> {
  logger.info('Running PEC reminder job')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Fetch all PECs that are not yet delivered and have a due_date
    const pecs = await listAllDocuments(
      config.APPWRITE_DATABASE_ID,
      config.COL_PECS,
      [
        Query.notEqual('status', 'entregada'),
        Query.notEqual('status', 'calificada'),
        Query.isNotNull('due_date'),
      ]
    )

    for (const pec of pecs) {
      const dueDate = new Date(pec.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.round((dueDate.getTime() - today.getTime()) / 86400000)

      const reminderDays = parseReminderDays(pec.reminder_days, pec.$id)

      if (!reminderDays.includes(daysLeft)) continue

      // Avoid duplicate reminders on the same day
      if (pec.last_reminder_sent) {
        const lastSent = new Date(pec.last_reminder_sent)
        lastSent.setHours(0, 0, 0, 0)
        if (lastSent.getTime() === today.getTime()) continue
      }

      // Fetch subscriptions for this user
      const subs = await listAllDocuments(
        config.APPWRITE_DATABASE_ID,
        config.COL_PUSH_SUBSCRIPTIONS,
        [Query.equal('user_id', pec.user_id)]
      )

      const payload = pecReminderPayload(pec.title, pec.subject_name ?? '', daysLeft)

      for (const sub of subs) {
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
