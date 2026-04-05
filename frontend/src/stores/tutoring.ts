import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tutoringCol } from '@/lib/collections'
import type { TutoringPeriodicity, TutoringSession } from '@/types'
import { addDays, format } from 'date-fns'
import { useAuthStore } from './auth'

export const useTutoringStore = defineStore('tutoring', () => {
  const sessionsBySubject = ref<Record<string, TutoringSession[]>>({})
  const sessionsInRange = ref<TutoringSession[]>([])

  async function fetchBySubject(subjectId: string) {
    sessionsBySubject.value[subjectId] = await tutoringCol.listBySubject(subjectId)
  }

  async function fetchByDateRange(fromDay: string, toDay: string) {
    const auth = useAuthStore()
    sessionsInRange.value = await tutoringCol.listByDateRange(auth.userId, fromDay, toDay)
  }

  async function create(data: Omit<TutoringSession, '$id' | '$createdAt' | '$updatedAt'>) {
    const session = await tutoringCol.create(data)
    const list = sessionsBySubject.value[data.subject_id] ?? []
    list.unshift(session)
    sessionsBySubject.value[data.subject_id] = list
    return session
  }

  async function createSeries(
    data: Omit<TutoringSession, '$id' | '$createdAt' | '$updatedAt'>,
    periodicity: Exclude<TutoringPeriodicity, 'none'>,
    recurrenceEndDate: string,
  ) {
    const startDate = new Date(data.date)
    const endDate = new Date(recurrenceEndDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      throw new Error('Rango de recurrencia inválido')
    }

    const daysStep = periodicity === 'biweekly' ? 14 : 7
    const seriesId = `series-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const created: TutoringSession[] = []

    for (let i = 0, cursor = startDate; cursor <= endDate; i += 1, cursor = addDays(startDate, (i + 1) * daysStep)) {
      if (i >= 104) break
      const session = await create({
        ...data,
        date: cursor.toISOString(),
        periodicity,
        recurrence_end_date: recurrenceEndDate,
        series_id: seriesId,
        series_position: i + 1,
      })
      created.push(session)
    }

    return created
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

  function tutoringsForDay(day: Date, source: 'range' | 'subject' = 'range', subjectId?: string): TutoringSession[] {
    const dayKey = format(day, 'yyyy-MM-dd')
    if (source === 'subject' && subjectId) {
      return (sessionsBySubject.value[subjectId] ?? []).filter((s) => format(new Date(s.date), 'yyyy-MM-dd') === dayKey)
    }
    return sessionsInRange.value.filter((s) => format(new Date(s.date), 'yyyy-MM-dd') === dayKey)
  }

  return {
    sessionsBySubject,
    sessionsInRange,
    fetchBySubject,
    fetchByDateRange,
    tutoringsForDay,
    create,
    createSeries,
    update,
    remove,
  }
})
