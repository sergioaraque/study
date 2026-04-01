import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pecCol } from '@/lib/collections'
import { useAuthStore } from './auth'
import type { Pec } from '@/types'

export const usePecStore = defineStore('pec', () => {
  const pecsBySubject = ref<Record<string, Pec[]>>({})
  const upcomingPecs = ref<Pec[]>([])

  async function fetchBySubject(subjectId: string) {
    pecsBySubject.value[subjectId] = await pecCol.listBySubject(subjectId)
  }

  async function fetchUpcoming() {
    const auth = useAuthStore()
    upcomingPecs.value = await pecCol.listUpcoming(auth.userId)
  }

  async function create(data: Omit<Pec, '$id' | '$createdAt' | '$updatedAt'>) {
    const pec = await pecCol.create(data)
    const list = pecsBySubject.value[data.subject_id] ?? []
    list.push(pec)
    pecsBySubject.value[data.subject_id] = list
    return pec
  }

  async function update(id: string, subjectId: string, data: Partial<Pec>) {
    const updated = await pecCol.update(id, data)
    const list = pecsBySubject.value[subjectId] ?? []
    const idx = list.findIndex((p) => p.$id === id)
    if (idx !== -1) list[idx] = updated
    return updated
  }

  async function remove(id: string, subjectId: string) {
    await pecCol.delete(id)
    pecsBySubject.value[subjectId] = (pecsBySubject.value[subjectId] ?? []).filter(
      (p) => p.$id !== id
    )
  }

  return { pecsBySubject, upcomingPecs, fetchBySubject, fetchUpcoming, create, update, remove }
})
