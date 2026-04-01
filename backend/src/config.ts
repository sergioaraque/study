import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3001'),
  APPWRITE_ENDPOINT: z.string().url(),
  APPWRITE_PROJECT_ID: z.string().min(1),
  APPWRITE_API_KEY: z.string().min(1),
  APPWRITE_DATABASE_ID: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_MAILTO: z.string().email(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  // Collection IDs
  COL_PUSH_SUBSCRIPTIONS: z.string().min(1),
  COL_PECS: z.string().min(1),
  COL_EXAMS: z.string().min(1),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
