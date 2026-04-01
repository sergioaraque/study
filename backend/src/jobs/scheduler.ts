import { schedule, type ScheduledTask } from 'node-cron'
import { runPecReminders } from './pec-reminders.js'
import { runExamReminders } from './exam-reminders.js'
import { logger } from '../lib/logger.js'

let tasks: ScheduledTask[] = []

export function startScheduler(): void {
  // Run every day at 08:00
  const dailyJob = schedule('0 8 * * *', async () => {
    logger.info('Daily reminder job triggered')
    await runPecReminders()
    await runExamReminders()
  })

  tasks.push(dailyJob)
  logger.info('Scheduler started — daily reminders at 08:00')
}

export function stopScheduler(): void {
  tasks.forEach((t) => t.stop())
  tasks = []
  logger.info('Scheduler stopped')
}
