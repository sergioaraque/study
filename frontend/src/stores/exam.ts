import { defineStore } from 'pinia'
import { ref } from 'vue'
import { examCol } from '@/lib/collections'
import { useAuthStore } from './auth'
import type { Exam } from '@/types'

export const useExamStore = defineStore('exam', () => {
  const examsBySubject = ref<Record<string, Exam[]>>({})
  const upcomingExams = ref<Exam[]>([])

  async function fetchBySubject(subjectId: string) {
    examsBySubject.value[subjectId] = await examCol.listBySubject(subjectId)
  }

  async function fetchUpcoming() {
    const auth = useAuthStore()
    upcomingExams.value = await examCol.listUpcoming(auth.userId)
  }

  async function create(data: Omit<Exam, '$id' | '$createdAt' | '$updatedAt'>) {
    const exam = await examCol.create(data)
    const list = examsBySubject.value[data.subject_id] ?? []
    list.push(exam)
    examsBySubject.value[data.subject_id] = list
    return exam
  }

  async function update(id: string, subjectId: string, data: Partial<Exam>) {
    const updated = await examCol.update(id, data)
    const list = examsBySubject.value[subjectId] ?? []
    const idx = list.findIndex((e) => e.$id === id)
    if (idx !== -1) list[idx] = updated
    return updated
  }

  async function remove(id: string, subjectId: string) {
    await examCol.delete(id)
    examsBySubject.value[subjectId] = (examsBySubject.value[subjectId] ?? []).filter(
      (e) => e.$id !== id
    )
  }

  function getChosenDate(exam: Exam): string | undefined {
    return exam.chosen_convocatoria === 2
      ? exam.convocatoria_2_date
      : exam.convocatoria_1_date
  }

  return { examsBySubject, upcomingExams, fetchBySubject, fetchUpcoming, create, update, remove, getChosenDate }
})
