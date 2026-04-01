// ── Base ──────────────────────────────────────────────────────────────────────
export interface AppwriteDoc {
  $id: string
  $createdAt: string
  $updatedAt: string
}

// ── Domain types ──────────────────────────────────────────────────────────────

export interface WeeklySchedule {
  hours_mon: number
  hours_tue: number
  hours_wed: number
  hours_thu: number
  hours_fri: number
  hours_sat: number
  hours_sun: number
}

export interface Semester extends AppwriteDoc {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  user_id: string
  schedule_json?: string  // JSON: {"mon":2,"tue":3,"wed":1,"thu":2,"fri":2,"sat":0,"sun":0}
  weekly_hours_goal?: number
}

export type SubjectStatus = 'activa' | 'convalidada' | 'aprobada' | 'pendiente'

export interface Subject extends AppwriteDoc {
  semester_id: string   // '' = biblioteca (no semester assigned)
  user_id: string
  name: string
  code?: string
  credits: number
  degree_year?: number
  description?: string
  status: SubjectStatus
  notes_markdown?: string
  pec_weight: number
  grade_pec?: number
  grade_exam_c1?: number
  grade_exam_c2?: number
  grade_final?: number
}

export type TopicStatus = 'pendiente' | 'en_progreso' | 'completado'

export interface Topic extends AppwriteDoc {
  subject_id: string
  user_id: string
  number: number
  title: string
  status: TopicStatus
  planned_week?: string   // "YYYY-WNN"
  completed_week?: string
  estimated_hours?: number
  real_hours: number
  notes?: string
  planner_day?: string    // "YYYY-MM-DD"
  completed_date?: string // "YYYY-MM-DD" — set when status → completado
}

export interface StudySession extends AppwriteDoc {
  topic_id: string
  subject_id: string
  user_id: string
  started_at: string
  ended_at: string
  duration_minutes: number
  notes?: string
  session_date: string    // "YYYY-MM-DD"
}

export type PecStatus = 'pendiente' | 'en_progreso' | 'entregada' | 'calificada'

export interface Pec extends AppwriteDoc {
  subject_id: string
  user_id: string
  title: string
  description?: string
  due_date?: string
  status: PecStatus
  grade?: number
  reminder_days?: string  // JSON array e.g. "[7,3,1]"
  last_reminder_sent?: string
}

export interface Exam extends AppwriteDoc {
  subject_id: string
  user_id: string
  convocatoria_1_date?: string
  convocatoria_1_location?: string
  convocatoria_2_date?: string
  convocatoria_2_location?: string
  chosen_convocatoria?: 1 | 2
  grade_c1?: number
  grade_c2?: number
  reminder_days?: string
  last_reminder_sent_c1?: string
  last_reminder_sent_c2?: string
}

export interface TopicTask extends AppwriteDoc {
  topic_id: string
  user_id: string
  title: string
  done: boolean
  order: number
}

export interface TutoringSession extends AppwriteDoc {
  subject_id: string
  user_id: string
  date: string
  notes?: string
  review_tasks?: string   // JSON array of strings
}
