import { schedule, type ScheduledTask } from 'node-cron'
import { runPecReminders } from './pec-reminders.js'
import { runExamReminders } from './exam-reminders.js'
import { logger } from '../lib/logger.js'

let tasks: ScheduledTask[] = []
let isRunningDailyJob = false

export function startScheduler(): void {
  // Run every day at 08:00
  const dailyJob = schedule('0 8 * * *', async () => {
    if (isRunningDailyJob) {
      logger.warn('Daily reminder job skipped because previous run is still in progress')
      return
    }

    isRunningDailyJob = true
    logger.info('Daily reminder job triggered')
    try {
      await runPecReminders()
      await runExamReminders()
    } finally {
      isRunningDailyJob = false
    }
  })

  tasks.push(dailyJob)
  logger.info('Scheduler started — daily reminders at 08:00')
}

export function stopScheduler(): void {
  tasks.forEach((t) => t.stop())
  tasks = []
  logger.info('Scheduler stopped')
}
