import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tutoringCol } from '@/lib/collections'
import type { TutoringSession } from '@/types'

export const useTutoringStore = defineStore('tutoring', () => {
  const sessionsBySubject = ref<Record<string, TutoringSession[]>>({})

  async function fetchBySubject(subjectId: string) {
    sessionsBySubject.value[subjectId] = await tutoringCol.listBySubject(subjectId)
  }

  async function create(data: Omit<TutoringSession, '$id' | '$createdAt' | '$updatedAt'>) {
    const session = await tutoringCol.create(data)
    const list = sessionsBySubject.value[data.subject_id] ?? []
    list.unshift(session)
    sessionsBySubject.value[data.subject_id] = list
    return session
  }

  async function update(id: string, subjectId: string, data: Partial<TutoringSession>) {
    const updated = await tutoringCol.update(id, data)
    const list = sessionsBySubject.value[subjectId] ?? []
    const idx = list.findIndex((s) => s.$id === id)
    if (idx !== -1) list[idx] = updated
    return updated
  }

  async function remove(id: string, subjectId: string) {
    await tutoringCol.delete(id)
    sessionsBySubject.value[subjectId] = (sessionsBySubject.value[subjectId] ?? []).filter(
      (s) => s.$id !== id
    )
  }

  return { sessionsBySubject, fetchBySubject, create, update, remove }
})
