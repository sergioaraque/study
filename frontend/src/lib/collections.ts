/**
 * Typed wrappers around Appwrite collections.
 * Collection IDs come from env vars so they never appear hardcoded in stores.
 */
import { databases } from './appwrite'
import { Query, ID, type Models } from 'appwrite'
import type {
  Semester, Subject, Topic, StudySession,
  Pec, Exam, TutoringSession, TopicTask,
} from '@/types'

const DB = () => import.meta.env.VITE_APPWRITE_DATABASE_ID as string

const COL = {
  semesters: () => import.meta.env.VITE_COL_SEMESTERS as string,
  subjects: () => import.meta.env.VITE_COL_SUBJECTS as string,
  topics: () => import.meta.env.VITE_COL_TOPICS as string,
  studySessions: () => import.meta.env.VITE_COL_STUDY_SESSIONS as string,
  pecs: () => import.meta.env.VITE_COL_PECS as string,
  exams: () => import.meta.env.VITE_COL_EXAMS as string,
  tutoringSessions: () => import.meta.env.VITE_COL_TUTORING_SESSIONS as string,
  topicTasks: () => import.meta.env.VITE_COL_TOPIC_TASKS as string,
}

// ── Generic helpers ──────────────────────────────────────────────────────────

function doc<T>(raw: Models.Document): T {
  return raw as unknown as T
}

// ── Semesters ────────────────────────────────────────────────────────────────

export const semesterCol = {
  list: (userId: string) =>
    databases.listDocuments(DB(), COL.semesters(), [
      Query.equal('user_id', userId),
      Query.limit(50),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Semester>(d))
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
    ),

  create: (data: Omit<Semester, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.semesters(), ID.unique(), data).then((d: Models.Document) => doc<Semester>(d)),

  update: (id: string, data: Partial<Semester>) =>
    databases.updateDocument(DB(), COL.semesters(), id, data).then((d: Models.Document) => doc<Semester>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.semesters(), id),
}

// ── Subjects ─────────────────────────────────────────────────────────────────

export const subjectCol = {
  listBySemester: (semesterId: string) =>
    databases.listDocuments(DB(), COL.subjects(), [
      Query.equal('semester_id', semesterId),
      Query.limit(50),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Subject>(d))
        .sort((a, b) => a.name.localeCompare(b.name))
    ),

  listByUser: (userId: string) =>
    databases.listDocuments(DB(), COL.subjects(), [
      Query.equal('user_id', userId),
      Query.limit(200),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents.map((d: Models.Document) => doc<Subject>(d))
    ),

  listLibrary: (userId: string) =>
    databases.listDocuments(DB(), COL.subjects(), [
      Query.equal('user_id', userId),
      Query.equal('semester_id', ''),
      Query.limit(200),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Subject>(d))
        .sort((a, b) => a.name.localeCompare(b.name))
    ),

  create: (data: Omit<Subject, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.subjects(), ID.unique(), data).then((d: Models.Document) => doc<Subject>(d)),

  update: (id: string, data: Partial<Subject>) =>
    databases.updateDocument(DB(), COL.subjects(), id, data).then((d: Models.Document) => doc<Subject>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.subjects(), id),
}

// ── Topics ───────────────────────────────────────────────────────────────────

export const topicCol = {
  listBySubject: (subjectId: string) =>
    databases.listDocuments(DB(), COL.topics(), [
      Query.equal('subject_id', subjectId),
      Query.limit(100),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Topic>(d))
        .sort((a, b) => a.number - b.number)
    ),

  listByPlannerDay: (dayFrom: string, dayTo: string, userId: string) =>
    databases.listDocuments(DB(), COL.topics(), [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('planner_day', dayFrom),
      Query.lessThanEqual('planner_day', dayTo),
      Query.limit(200),
    ]).then((r: Models.DocumentList<Models.Document>) => r.documents.map((d: Models.Document) => doc<Topic>(d))),

  listOverdue: (userId: string, beforeDate: string) =>
    databases.listDocuments(DB(), COL.topics(), [
      Query.equal('user_id', userId),
      Query.lessThan('planner_day', beforeDate),
      Query.notEqual('status', 'completado'),
      Query.limit(100),
    ]).then((r: Models.DocumentList<Models.Document>) => r.documents.map((d: Models.Document) => doc<Topic>(d))),

  create: (data: Omit<Topic, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.topics(), ID.unique(), data).then((d: Models.Document) => doc<Topic>(d)),

  update: (id: string, data: Partial<Topic>) =>
    databases.updateDocument(DB(), COL.topics(), id, data).then((d: Models.Document) => doc<Topic>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.topics(), id),
}

// ── Study Sessions ───────────────────────────────────────────────────────────

export const studySessionCol = {
  listByTopic: (topicId: string) =>
    databases.listDocuments(DB(), COL.studySessions(), [
      Query.equal('topic_id', topicId),
      Query.limit(100),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<StudySession>(d))
        .sort((a, b) => b.started_at.localeCompare(a.started_at))
    ),

  listBySubject: (subjectId: string) =>
    databases.listDocuments(DB(), COL.studySessions(), [
      Query.equal('subject_id', subjectId),
      Query.limit(500),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents.map((d: Models.Document) => doc<StudySession>(d))
    ),

  listByDateRange: (userId: string, from: string, to: string) =>
    databases.listDocuments(DB(), COL.studySessions(), [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('session_date', from),
      Query.lessThanEqual('session_date', to),
      Query.limit(500),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents.map((d: Models.Document) => doc<StudySession>(d))
    ),

  listRecentDates: (userId: string, limit = 365) =>
    databases.listDocuments(DB(), COL.studySessions(), [
      Query.equal('user_id', userId),
      Query.limit(limit),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => (d as unknown as StudySession).session_date)
        .sort((a, b) => b.localeCompare(a))
    ),

  create: (data: Omit<StudySession, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.studySessions(), ID.unique(), data).then((d: Models.Document) => doc<StudySession>(d)),

  update: (id: string, data: Partial<StudySession>) =>
    databases.updateDocument(DB(), COL.studySessions(), id, data).then((d: Models.Document) => doc<StudySession>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.studySessions(), id),
}

// ── PECs ─────────────────────────────────────────────────────────────────────

export const pecCol = {
  listBySubject: (subjectId: string) =>
    databases.listDocuments(DB(), COL.pecs(), [
      Query.equal('subject_id', subjectId),
      Query.limit(20),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Pec>(d))
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    ),

  listUpcoming: (userId: string) =>
    databases.listDocuments(DB(), COL.pecs(), [
      Query.equal('user_id', userId),
      Query.notEqual('status', 'calificada'),
      Query.limit(20),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Pec>(d))
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    ),

  create: (data: Omit<Pec, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.pecs(), ID.unique(), data).then((d: Models.Document) => doc<Pec>(d)),

  update: (id: string, data: Partial<Pec>) =>
    databases.updateDocument(DB(), COL.pecs(), id, data).then((d: Models.Document) => doc<Pec>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.pecs(), id),
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export const examCol = {
  listBySubject: (subjectId: string) =>
    databases.listDocuments(DB(), COL.exams(), [
      Query.equal('subject_id', subjectId),
      Query.limit(5),
    ]).then((r: Models.DocumentList<Models.Document>) => r.documents.map((d: Models.Document) => doc<Exam>(d))),

  listUpcoming: (userId: string) =>
    databases.listDocuments(DB(), COL.exams(), [
      Query.equal('user_id', userId),
      Query.limit(20),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<Exam>(d))
        .sort((a, b) => (a.convocatoria_1_date ?? '').localeCompare(b.convocatoria_1_date ?? ''))
    ),

  create: (data: Omit<Exam, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.exams(), ID.unique(), data).then((d: Models.Document) => doc<Exam>(d)),

  update: (id: string, data: Partial<Exam>) =>
    databases.updateDocument(DB(), COL.exams(), id, data).then((d: Models.Document) => doc<Exam>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.exams(), id),
}

// ── Tutoring Sessions ────────────────────────────────────────────────────────

export const tutoringCol = {
  listBySubject: (subjectId: string) =>
    databases.listDocuments(DB(), COL.tutoringSessions(), [
      Query.equal('subject_id', subjectId),
      Query.limit(50),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<TutoringSession>(d))
        .sort((a, b) => b.date.localeCompare(a.date))
    ),

  listByDateRange: (userId: string, fromDay: string, toDay: string) =>
    databases.listDocuments(DB(), COL.tutoringSessions(), [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('date', `${fromDay}T00:00:00.000Z`),
      Query.lessThanEqual('date', `${toDay}T23:59:59.999Z`),
      Query.limit(200),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<TutoringSession>(d))
        .sort((a, b) => a.date.localeCompare(b.date))
    ),

  create: (data: Omit<TutoringSession, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.tutoringSessions(), ID.unique(), data).then((d: Models.Document) => doc<TutoringSession>(d)),

  update: (id: string, data: Partial<TutoringSession>) =>
    databases.updateDocument(DB(), COL.tutoringSessions(), id, data).then((d: Models.Document) => doc<TutoringSession>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.tutoringSessions(), id),
}

// ── Topic Tasks ──────────────────────────────────────────────────────────────

export const topicTaskCol = {
  listByTopic: (topicId: string) =>
    databases.listDocuments(DB(), COL.topicTasks(), [
      Query.equal('topic_id', topicId),
      Query.limit(50),
    ]).then((r: Models.DocumentList<Models.Document>) =>
      r.documents
        .map((d: Models.Document) => doc<TopicTask>(d))
        .sort((a, b) => a.order - b.order)
    ),

  create: (data: Omit<TopicTask, '$id' | '$createdAt' | '$updatedAt'>) =>
    databases.createDocument(DB(), COL.topicTasks(), ID.unique(), data).then((d: Models.Document) => doc<TopicTask>(d)),

  update: (id: string, data: Partial<TopicTask>) =>
    databases.updateDocument(DB(), COL.topicTasks(), id, data).then((d: Models.Document) => doc<TopicTask>(d)),

  delete: (id: string) =>
    databases.deleteDocument(DB(), COL.topicTasks(), id),
}
