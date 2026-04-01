export interface PushSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export type ReminderDays = number[]
