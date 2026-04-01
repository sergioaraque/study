import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { semesterCol } from '@/lib/collections'
import { useAuthStore } from './auth'
import type { Semester, WeeklySchedule } from '@/types'

export const DEFAULT_SCHEDULE: WeeklySchedule = {
  hours_mon: 0, hours_tue: 0, hours_wed: 0, hours_thu: 0,
  hours_fri: 0, hours_sat: 0, hours_sun: 0,
}

export function parseSchedule(s?: Semester | null): WeeklySchedule {
  if (!s?.schedule_json) return { ...DEFAULT_SCHEDULE }
  try {
    const raw = JSON.parse(s.schedule_json) as Record<string, number>
    return {
      hours_mon: raw.mon ?? 0,
      hours_tue: raw.tue ?? 0,
      hours_wed: raw.wed ?? 0,
      hours_thu: raw.thu ?? 0,
      hours_fri: raw.fri ?? 0,
      hours_sat: raw.sat ?? 0,
      hours_sun: raw.sun ?? 0,
    }
  } catch {
    return { ...DEFAULT_SCHEDULE }
  }
}

export function serializeSchedule(sch: WeeklySchedule): string {
  return JSON.stringify({
    mon: sch.hours_mon,
    tue: sch.hours_tue,
    wed: sch.hours_wed,
    thu: sch.hours_thu,
    fri: sch.hours_fri,
    sat: sch.hours_sat,
    sun: sch.hours_sun,
  })
}

export const useSemesterStore = defineStore('semester', () => {
  const semesters = ref<Semester[]>([])
  const loading = ref(false)

  const activeSemester = computed(() => semesters.value.find((s) => s.is_active) ?? null)
  const activeSchedule = computed(() => parseSchedule(activeSemester.value))

  async function fetchAll() {
    const auth = useAuthStore()
    if (!auth.userId) return
    loading.value = true
    try {
      semesters.value = await semesterCol.list(auth.userId)
    } finally {
      loading.value = false
    }
  }

  async function create(data: { name: string; start_date: string; end_date: string } & Partial<WeeklySchedule>) {
    const auth = useAuthStore()
    const { hours_mon, hours_tue, hours_wed, hours_thu, hours_fri, hours_sat, hours_sun, ...rest } = data
    const schedule: WeeklySchedule = {
      hours_mon: hours_mon ?? 0, hours_tue: hours_tue ?? 0, hours_wed: hours_wed ?? 0,
      hours_thu: hours_thu ?? 0, hours_fri: hours_fri ?? 0, hours_sat: hours_sat ?? 0, hours_sun: hours_sun ?? 0,
    }
    const semester = await semesterCol.create({
      ...rest,
      schedule_json: serializeSchedule(schedule),
      is_active: semesters.value.length === 0,
      user_id: auth.userId,
    })
    semesters.value.unshift(semester)
    return semester
  }

  async function updateSchedule(id: string, schedule: WeeklySchedule) {
    const schedule_json = serializeSchedule(schedule)
    await semesterCol.update(id, { schedule_json })
    semesters.value = semesters.value.map((s) =>
      s.$id === id ? { ...s, schedule_json } : s
    )
  }

  async function update(id: string, data: { name?: string; start_date?: string; end_date?: string } & Partial<WeeklySchedule>) {
    const { hours_mon, hours_tue, hours_wed, hours_thu, hours_fri, hours_sat, hours_sun, ...rest } = data
    const payload: Record<string, unknown> = { ...rest }
    if (hours_mon !== undefined || hours_tue !== undefined || hours_wed !== undefined ||
        hours_thu !== undefined || hours_fri !== undefined || hours_sat !== undefined || hours_sun !== undefined) {
      const existing = parseSchedule(semesters.value.find((s) => s.$id === id))
      payload.schedule_json = serializeSchedule({ ...existing, ...data as Partial<WeeklySchedule> })
    }
    await semesterCol.update(id, payload)
    await fetchAll()
  }

  async function setActive(id: string) {
    const updates = semesters.value.map((s) =>
      semesterCol.update(s.$id, { is_active: s.$id === id })
    )
    await Promise.all(updates)
    semesters.value = semesters.value.map((s) => ({ ...s, is_active: s.$id === id }))
  }

  async function archive(id: string) {
    await semesterCol.update(id, { is_active: false })
    semesters.value = semesters.value.map((s) =>
      s.$id === id ? { ...s, is_active: false } : s
    )
  }

  async function remove(id: string) {
    await semesterCol.delete(id)
    semesters.value = semesters.value.filter((s) => s.$id !== id)
  }

  return { semesters, loading, activeSemester, activeSchedule, fetchAll, create, update, updateSchedule, setActive, archive, remove }
})
