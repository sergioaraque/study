import { defineStore } from 'pinia'
import { ref } from 'vue'
import { topicCol } from '@/lib/collections'
import { getISOWeek, getISOWeekYear, format } from 'date-fns'
import type { Topic, TopicStatus } from '@/types'
import { useTopicTaskStore } from './topic-task'

export const useTopicStore = defineStore('topic', () => {
  // topics per subject — keyed by subjectId
  const topicsBySubject = ref<Record<string, Topic[]>>({})
  const loading = ref(false)

  function isoWeek(date: Date): string {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
  }

  async function fetchBySubject(subjectId: string) {
    loading.value = true
    try {
      topicsBySubject.value[subjectId] = await topicCol.listBySubject(subjectId)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Topic, '$id' | '$createdAt' | '$updatedAt'>) {
    const topic = await topicCol.create(data)
    const list = topicsBySubject.value[data.subject_id] ?? []
    list.push(topic)
    topicsBySubject.value[data.subject_id] = list
    // Auto-create template tasks
    const taskStore = useTopicTaskStore()
    await taskStore.createFromTemplate(topic.$id, data.user_id)
    return topic
  }

  async function update(id: string, subjectId: string, data: Partial<Topic>) {
    const updated = await topicCol.update(id, data)
    const list = topicsBySubject.value[subjectId] ?? []
    const idx = list.findIndex((t) => t.$id === id)
    if (idx !== -1) list[idx] = updated
    return updated
  }

  async function setStatus(id: string, subjectId: string, status: TopicStatus) {
    const patch: Partial<Topic> = { status }
    if (status === 'completado') {
      const now = new Date()
      patch.completed_week = isoWeek(now)
      patch.completed_date = format(now, 'yyyy-MM-dd')
    }
    return update(id, subjectId, patch)
  }

  async function assignToDay(id: string, subjectId: string, day: string | null) {
    return update(id, subjectId, { planner_day: day ?? undefined })
  }

  async function remove(id: string, subjectId: string) {
    await topicCol.delete(id)
    topicsBySubject.value[subjectId] = (topicsBySubject.value[subjectId] ?? []).filter(
      (t) => t.$id !== id
    )
  }

  function getBySubject(subjectId: string): Topic[] {
    return topicsBySubject.value[subjectId] ?? []
  }

  return {
    topicsBySubject, loading,
    fetchBySubject, create, update, setStatus, assignToDay, remove, getBySubject,
  }
})
