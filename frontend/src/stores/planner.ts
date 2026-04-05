import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { topicCol, tutoringCol } from '@/lib/collections'
import { useAuthStore } from './auth'
import { useTopicStore } from './topic'
import {
  startOfWeek, addWeeks, format,
  eachDayOfInterval, addDays, addMonths,
  startOfMonth, endOfMonth, getDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Topic, TutoringSession } from '@/types'

export const usePlannerStore = defineStore('planner', () => {
  const currentWeekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const currentMonth = ref(startOfMonth(new Date()))
  const weekTopics = ref<Topic[]>([])
  const monthTopics = ref<Topic[]>([])
  const weekTutorings = ref<TutoringSession[]>([])
  const monthTutorings = ref<TutoringSession[]>([])
  const overdueTopics = ref<Topic[]>([])
  const loading = ref(false)

  const weekDays = computed(() =>
    eachDayOfInterval({ start: currentWeekStart.value, end: addDays(currentWeekStart.value, 6) })
  )

  const weekLabel = computed(() =>
    `${format(currentWeekStart.value, "d MMM", { locale: es })} – ${format(addDays(currentWeekStart.value, 6), "d MMM yyyy", { locale: es })}`
  )

  const monthLabel = computed(() =>
    format(currentMonth.value, "MMMM yyyy", { locale: es })
  )

  // Calendar grid: weeks of the month (padded to full Mon-Sun rows)
  const monthCalendarDays = computed(() => {
    const first = startOfMonth(currentMonth.value)
    const last = endOfMonth(currentMonth.value)
    // Pad to Monday start (getDay: 0=Sun, 1=Mon…)
    const startPad = (getDay(first) + 6) % 7  // days to add before first
    const gridStart = addDays(first, -startPad)
    const totalDays = startPad + last.getDate()
    const weeks = Math.ceil(totalDays / 7)
    return Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i))
  })

  async function fetchWeek() {
    const auth = useAuthStore()
    loading.value = true
    try {
      const from = format(currentWeekStart.value, 'yyyy-MM-dd')
      const to = format(addDays(currentWeekStart.value, 6), 'yyyy-MM-dd')
      const [topics, tutorings] = await Promise.all([
        topicCol.listByPlannerDay(from, to, auth.userId),
        tutoringCol.listByDateRange(auth.userId, from, to),
      ])
      weekTopics.value = topics
      weekTutorings.value = tutorings
    } finally {
      loading.value = false
    }
  }

  async function fetchOverdue() {
    const auth = useAuthStore()
    const today = format(new Date(), 'yyyy-MM-dd')
    overdueTopics.value = await topicCol.listOverdue(auth.userId, today)
  }

  async function fetchMonth() {
    const auth = useAuthStore()
    loading.value = true
    try {
      // fetch a slightly wider range to cover padding days in the grid
      const gridDays = monthCalendarDays.value
      const from = format(gridDays[0], 'yyyy-MM-dd')
      const to = format(gridDays[gridDays.length - 1], 'yyyy-MM-dd')
      const [topics, tutorings] = await Promise.all([
        topicCol.listByPlannerDay(from, to, auth.userId),
        tutoringCol.listByDateRange(auth.userId, from, to),
      ])
      monthTopics.value = topics
      monthTutorings.value = tutorings
    } finally {
      loading.value = false
    }
  }

  function topicsForDay(day: Date, source: 'week' | 'month' = 'week'): Topic[] {
    const dayStr = format(day, 'yyyy-MM-dd')
    const list = source === 'month' ? monthTopics.value : weekTopics.value
    return list.filter((t) => t.planner_day === dayStr)
  }

  function tutoringsForDay(day: Date, source: 'week' | 'month' = 'week'): TutoringSession[] {
    const dayStr = format(day, 'yyyy-MM-dd')
    const list = source === 'month' ? monthTutorings.value : weekTutorings.value
    return list.filter((session) => format(new Date(session.date), 'yyyy-MM-dd') === dayStr)
  }

  async function assignTopicToDay(topicId: string, subjectId: string, day: Date | null) {
    const topicStore = useTopicStore()
    const dayStr = day ? format(day, 'yyyy-MM-dd') : undefined
    await topicStore.assignToDay(topicId, subjectId, dayStr ?? null)
    // Refresh all caches
    if (weekTopics.value.length) await fetchWeek()
    if (monthTopics.value.length) await fetchMonth()
    await fetchOverdue()
  }

  function prevWeek() {
    currentWeekStart.value = addWeeks(currentWeekStart.value, -1)
    fetchWeek()
  }

  function nextWeek() {
    currentWeekStart.value = addWeeks(currentWeekStart.value, 1)
    fetchWeek()
  }

  function goToCurrentWeek() {
    currentWeekStart.value = startOfWeek(new Date(), { weekStartsOn: 1 })
    fetchWeek()
  }

  function prevMonth() {
    currentMonth.value = addMonths(currentMonth.value, -1)
    fetchMonth()
  }

  function nextMonth() {
    currentMonth.value = addMonths(currentMonth.value, 1)
    fetchMonth()
  }

  function goToCurrentMonth() {
    currentMonth.value = startOfMonth(new Date())
    fetchMonth()
  }

  return {
    currentWeekStart, currentMonth, weekTopics, monthTopics, weekTutorings, monthTutorings, overdueTopics, loading,
    weekDays, weekLabel, monthLabel, monthCalendarDays,
    fetchWeek, fetchMonth, fetchOverdue, topicsForDay, tutoringsForDay, assignTopicToDay,
    prevWeek, nextWeek, goToCurrentWeek,
    prevMonth, nextMonth, goToCurrentMonth,
  }
})
