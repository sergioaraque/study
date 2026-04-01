import { defineStore } from 'pinia'
import { ref } from 'vue'
import { studySessionCol, topicCol } from '@/lib/collections'
import { useAuthStore } from './auth'
import { format } from 'date-fns'
import type { StudySession } from '@/types'

export const useStudySessionStore = defineStore('studySession', () => {
  const sessionsByTopic = ref<Record<string, StudySession[]>>({})
  const recentDates = ref<string[]>([])

  async function fetchByTopic(topicId: string) {
    sessionsByTopic.value[topicId] = await studySessionCol.listByTopic(topicId)
  }

  async function fetchRecentDates() {
    const auth = useAuthStore()
    recentDates.value = await studySessionCol.listRecentDates(auth.userId)
  }

  async function create(data: {
    topic_id: string
    subject_id: string
    started_at: string
    ended_at: string
    notes?: string
  }) {
    const auth = useAuthStore()
    const start = new Date(data.started_at)
    const end = new Date(data.ended_at)
    const duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000)
    const session_date = format(start, 'yyyy-MM-dd')

    const session = await studySessionCol.create({
      ...data,
      user_id: auth.userId,
      duration_minutes,
      session_date,
    })

    const list = sessionsByTopic.value[data.topic_id] ?? []
    list.unshift(session)
    sessionsByTopic.value[data.topic_id] = list

    // Update real_hours on the topic
    const allSessions = list
    const totalMinutes = allSessions.reduce((acc, s) => acc + s.duration_minutes, 0)
    await topicCol.update(data.topic_id, { real_hours: +(totalMinutes / 60).toFixed(2) })

    // Keep recentDates fresh
    if (!recentDates.value.includes(session_date)) {
      recentDates.value.unshift(session_date)
    }

    return session
  }

  async function remove(id: string, topicId: string) {
    await studySessionCol.delete(id)
    sessionsByTopic.value[topicId] = (sessionsByTopic.value[topicId] ?? []).filter(
      (s) => s.$id !== id
    )
  }

  return { sessionsByTopic, recentDates, fetchByTopic, fetchRecentDates, create, remove }
})
