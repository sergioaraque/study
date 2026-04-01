import { Hono } from 'hono'
import { config } from '../config.js'

const vapid = new Hono()

vapid.get('/public-key', (c) => {
  return c.json({ publicKey: config.VAPID_PUBLIC_KEY })
})

export default vapid
