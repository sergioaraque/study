import { Query } from 'node-appwrite'
import { databases, listAllDocuments } from '../lib/appwrite.js'
import { sendNotification } from '../push/sender.js'
import { examReminderPayload } from '../push/templates.js'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import type { ReminderDays } from '../types/index.js'

function parseReminderDays(raw: unknown, examId: string): ReminderDays {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is number => Number.isInteger(v))
  } catch {
    logger.warn('Invalid reminder_days in exam, skipping reminders for this entry', { examId })
    return []
  }
}

export async function runExamReminders(): Promise<void> {
  logger.info('Running exam reminder job')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const exams = await listAllDocuments(
      config.APPWRITE_DATABASE_ID,
      config.COL_EXAMS,
      []
    )

    for (const exam of exams) {
      const reminderDays = parseReminderDays(exam.reminder_days, exam.$id)

      const chosen = exam.chosen_convocatoria as 1 | 2 | null

      const convocatorias: Array<{ conv: 1 | 2; dateStr: string | null; lastSentField: string }> = [
        { conv: 1, dateStr: exam.convocatoria_1_date, lastSentField: 'last_reminder_sent_c1' },
        { conv: 2, dateStr: exam.convocatoria_2_date, lastSentField: 'last_reminder_sent_c2' },
      ]

      for (const { conv, dateStr, lastSentField } of convocatorias) {
        // Skip if user hasn't chosen this convocatoria (or none chosen yet — notify both)
        if (chosen !== null && chosen !== conv) continue
        if (!dateStr) continue

        const examDate = new Date(dateStr)
        examDate.setHours(0, 0, 0, 0)
        const daysLeft = Math.round((examDate.getTime() - today.getTime()) / 86400000)

        if (!reminderDays.includes(daysLeft)) continue

        // Avoid duplicate
        if (exam[lastSentField]) {
          const lastSent = new Date(exam[lastSentField])
          lastSent.setHours(0, 0, 0, 0)
          if (lastSent.getTime() === today.getTime()) continue
        }

        const subs = await listAllDocuments(
          config.APPWRITE_DATABASE_ID,
          config.COL_PUSH_SUBSCRIPTIONS,
          [Query.equal('user_id', exam.user_id)]
        )

        const payload = examReminderPayload(exam.subject_name ?? '', conv, daysLeft)

        for (const sub of subs) {
          try {
            await sendNotification({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload)
          } catch (err: unknown) {
            if ((err as { expired?: boolean }).expired) {
              await databases.deleteDocument(config.APPWRITE_DATABASE_ID, config.COL_PUSH_SUBSCRIPTIONS, sub.$id)
            }
          }
        }

        await databases.updateDocument(config.APPWRITE_DATABASE_ID, config.COL_EXAMS, exam.$id, {
          [lastSentField]: new Date().toISOString(),
        })
      }
    }
  } catch (err) {
    logger.error('Exam reminder job failed', err)
  }
}
