/**
 * Run once to create all Appwrite collections and indexes.
 * Usage: npm run setup-appwrite
 *
 * Set env vars first: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 */
import { Client, Databases, IndexType } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const db = new Databases(client)
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!

async function createCollection(id: string, name: string) {
  try {
    const col = await db.createCollection(DATABASE_ID, id, name, [
      'read("users")',
      'create("users")',
      'update("users")',
      'delete("users")',
    ])
    console.log(`✅ Created collection: ${name}`)
    return col
  } catch (err: unknown) {
    const msg = (err as { message?: string }).message ?? String(err)
    if (msg.includes('already exists') || msg.includes('409')) {
      console.log(`⏭️  Collection ${name} already exists, skipping`)
    } else {
      console.error(`❌ Failed to create collection ${name}: ${msg}`)
      throw err
    }
    return null
  }
}

// Appwrite 1.7.4 bug: checks size limit BEFORE checking for duplicates,
// so existing large attributes return 400 (attribute_limit_exceeded) instead of 409.
// We treat this as "already exists" since the script runs idempotently.
function isSkippable(err: unknown): boolean {
  const e = err as { code?: number; type?: string; message?: string }
  return e.code === 409 || e.type === 'attribute_limit_exceeded' ||
    (e.message ?? '').includes('already exists')
}

async function str(colId: string, key: string, size: number, required = false, defaultVal?: string) {
  try {
    await db.createStringAttribute(DATABASE_ID, colId, key, size, required, defaultVal)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function bool(colId: string, key: string, required = false, defaultVal?: boolean) {
  try {
    await db.createBooleanAttribute(DATABASE_ID, colId, key, required, defaultVal)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function float(colId: string, key: string, required = false, defaultVal?: number) {
  try {
    await db.createFloatAttribute(DATABASE_ID, colId, key, required, undefined, undefined, defaultVal)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function int(colId: string, key: string, required = false, defaultVal?: number) {
  try {
    await db.createIntegerAttribute(DATABASE_ID, colId, key, required, undefined, undefined, defaultVal)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function datetime(colId: string, key: string, required = false) {
  try {
    await db.createDatetimeAttribute(DATABASE_ID, colId, key, required)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function index(colId: string, indexId: string, type: IndexType, attrs: string[]) {
  try {
    await db.createIndex(DATABASE_ID, colId, indexId, type, attrs)
  } catch (err: unknown) {
    if (!isSkippable(err)) throw err
  }
}

async function main() {
  console.log('Setting up Appwrite collections...')

  // ── semesters ──────────────────────────────────────────
  await createCollection('semesters', 'Semesters')
  await str('semesters', 'name', 100, true)
  await datetime('semesters', 'start_date', true)
  await datetime('semesters', 'end_date', true)
  await bool('semesters', 'is_active', false, false)
  await str('semesters', 'user_id', 36, true)
  await str('semesters', 'schedule_json', 200)
  await int('semesters', 'weekly_hours_goal')
  await index('semesters', 'idx_user', IndexType.Key, ['user_id'])
  await index('semesters', 'idx_active', IndexType.Key, ['is_active'])

  // ── subjects ───────────────────────────────────────────
  await createCollection('subjects', 'Subjects')
  // semester_id is optional so subjects can live in the library without a semester
  await str('subjects', 'semester_id', 36, false, '')
  // If it was already created as required, update it to non-required
  try {
    await db.updateStringAttribute(DATABASE_ID, 'subjects', 'semester_id', false, '')
  } catch { /* already optional */ }
  await str('subjects', 'user_id', 36, true)
  await str('subjects', 'name', 200, true)
  await str('subjects', 'code', 20)
  await float('subjects', 'credits', true)
  await int('subjects', 'degree_year')
  await str('subjects', 'description', 1000)
  await str('subjects', 'status', 20, false, 'pendiente')
  await str('subjects', 'notes_markdown', 100000)
  await float('subjects', 'pec_weight', false, 40)
  await float('subjects', 'grade_pec')
  await float('subjects', 'grade_exam_c1')
  await float('subjects', 'grade_exam_c2')
  await float('subjects', 'grade_final')
  await index('subjects', 'idx_semester', IndexType.Key, ['semester_id'])
  await index('subjects', 'idx_user', IndexType.Key, ['user_id'])
  await index('subjects', 'idx_status', IndexType.Key, ['status'])

  // ── topics ─────────────────────────────────────────────
  await createCollection('topics', 'Topics')
  await str('topics', 'subject_id', 36, true)
  await str('topics', 'user_id', 36, true)
  await int('topics', 'number', true)
  await str('topics', 'title', 300, true)
  await str('topics', 'status', 20, false, 'pendiente')
  await str('topics', 'planned_week', 10)
  await str('topics', 'completed_week', 10)
  await float('topics', 'estimated_hours')
  await float('topics', 'real_hours', false, 0)
  await str('topics', 'notes', 5000)
  await str('topics', 'planner_day', 10)
  await str('topics', 'completed_date', 10)
  await index('topics', 'idx_subject', IndexType.Key, ['subject_id'])
  await index('topics', 'idx_user', IndexType.Key, ['user_id'])
  await index('topics', 'idx_status', IndexType.Key, ['status'])
  await index('topics', 'idx_planner_day', IndexType.Key, ['planner_day'])
  await index('topics', 'idx_planned_week', IndexType.Key, ['planned_week'])

  // ── study_sessions ─────────────────────────────────────
  await createCollection('study_sessions', 'Study Sessions')
  await str('study_sessions', 'topic_id', 36, true)
  await str('study_sessions', 'subject_id', 36, true)
  await str('study_sessions', 'user_id', 36, true)
  await datetime('study_sessions', 'started_at', true)
  await datetime('study_sessions', 'ended_at', true)
  await int('study_sessions', 'duration_minutes', true)
  await str('study_sessions', 'notes', 2000)
  await str('study_sessions', 'session_date', 10, true)
  await index('study_sessions', 'idx_user', IndexType.Key, ['user_id'])
  await index('study_sessions', 'idx_topic', IndexType.Key, ['topic_id'])
  await index('study_sessions', 'idx_date', IndexType.Key, ['session_date'])
  await index('study_sessions', 'idx_subject', IndexType.Key, ['subject_id'])

  // ── pecs ───────────────────────────────────────────────
  await createCollection('pecs', 'PECs')
  await str('pecs', 'subject_id', 36, true)
  await str('pecs', 'user_id', 36, true)
  await str('pecs', 'title', 200, true)
  await str('pecs', 'description', 5000)
  await datetime('pecs', 'due_date')
  await str('pecs', 'status', 20, false, 'pendiente')
  await float('pecs', 'grade')
  await str('pecs', 'reminder_days', 50)
  await datetime('pecs', 'last_reminder_sent')
  await index('pecs', 'idx_subject', IndexType.Key, ['subject_id'])
  await index('pecs', 'idx_user', IndexType.Key, ['user_id'])
  await index('pecs', 'idx_due_date', IndexType.Key, ['due_date'])
  await index('pecs', 'idx_status', IndexType.Key, ['status'])

  // ── exams ──────────────────────────────────────────────
  await createCollection('exams', 'Exams')
  await str('exams', 'subject_id', 36, true)
  await str('exams', 'user_id', 36, true)
  await datetime('exams', 'convocatoria_1_date')
  await str('exams', 'convocatoria_1_location', 300)
  await datetime('exams', 'convocatoria_2_date')
  await str('exams', 'convocatoria_2_location', 300)
  await int('exams', 'chosen_convocatoria')
  await float('exams', 'grade_c1')
  await float('exams', 'grade_c2')
  await str('exams', 'reminder_days', 50)
  await datetime('exams', 'last_reminder_sent_c1')
  await datetime('exams', 'last_reminder_sent_c2')
  await index('exams', 'idx_subject', IndexType.Key, ['subject_id'])
  await index('exams', 'idx_user', IndexType.Key, ['user_id'])
  await index('exams', 'idx_c1_date', IndexType.Key, ['convocatoria_1_date'])
  await index('exams', 'idx_c2_date', IndexType.Key, ['convocatoria_2_date'])

  // ── tutoring_sessions ──────────────────────────────────
  await createCollection('tutoring_sessions', 'Tutoring Sessions')
  await str('tutoring_sessions', 'subject_id', 36, true)
  await str('tutoring_sessions', 'user_id', 36, true)
  await datetime('tutoring_sessions', 'date', true)
  await str('tutoring_sessions', 'notes', 10000)
  await str('tutoring_sessions', 'review_tasks', 5000)
  await index('tutoring_sessions', 'idx_subject', IndexType.Key, ['subject_id'])
  await index('tutoring_sessions', 'idx_user', IndexType.Key, ['user_id'])
  await index('tutoring_sessions', 'idx_date', IndexType.Key, ['date'])

  // ── topic_tasks ────────────────────────────────────────
  await createCollection('topic_tasks', 'Topic Tasks')
  await str('topic_tasks', 'topic_id', 36, true)
  await str('topic_tasks', 'user_id', 36, true)
  await str('topic_tasks', 'title', 200, true)
  await bool('topic_tasks', 'done', false, false)
  await int('topic_tasks', 'order', false, 0)
  await index('topic_tasks', 'idx_topic', IndexType.Key, ['topic_id'])
  await index('topic_tasks', 'idx_user', IndexType.Key, ['user_id'])

  // ── push_subscriptions ─────────────────────────────────
  await createCollection('push_subscriptions', 'Push Subscriptions')
  await str('push_subscriptions', 'user_id', 36, true)
  await str('push_subscriptions', 'endpoint', 500, true)
  await str('push_subscriptions', 'p256dh', 200, true)
  await str('push_subscriptions', 'auth', 100, true)
  await str('push_subscriptions', 'user_agent', 300)
  await str('push_subscriptions', 'created_at_iso', 30, true)
  await index('push_subscriptions', 'idx_user', IndexType.Key, ['user_id'])
  await index('push_subscriptions', 'idx_endpoint', IndexType.Unique, ['endpoint'])

  console.log('✅ Appwrite setup complete!')
  console.log('')
  console.log('Copy these collection IDs to your .env files:')
  console.log('COL_SEMESTERS=semesters')
  console.log('COL_SUBJECTS=subjects')
  console.log('COL_TOPICS=topics')
  console.log('COL_STUDY_SESSIONS=study_sessions')
  console.log('COL_PECS=pecs')
  console.log('COL_EXAMS=exams')
  console.log('COL_TUTORING_SESSIONS=tutoring_sessions')
  console.log('COL_PUSH_SUBSCRIPTIONS=push_subscriptions')
  console.log('COL_TOPIC_TASKS=topic_tasks')
}

main().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
