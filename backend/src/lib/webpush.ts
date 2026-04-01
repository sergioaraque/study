import webpush from 'web-push'
import { config } from '../config.js'

webpush.setVapidDetails(
  `mailto:${config.VAPID_MAILTO}`,
  config.VAPID_PUBLIC_KEY,
  config.VAPID_PRIVATE_KEY
)

export { webpush }
