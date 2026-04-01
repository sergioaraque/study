import { computed } from 'vue'
import { format, subDays } from 'date-fns'
import { useStudySessionStore } from '@/stores/study-session'

export function useStreak() {
  const sessionStore = useStudySessionStore()

  const activityMap = computed(() => {
    const map = new Map<string, boolean>()
    for (const date of sessionStore.recentDates) {
      map.set(date, true)
    }
    return map
  })

  const streak = computed(() => {
    let count = 0
    let day = new Date()
    // Check today first; if no session today, check if yesterday had one to avoid breaking streak
    const todayStr = format(day, 'yyyy-MM-dd')
    if (!activityMap.value.has(todayStr)) {
      day = subDays(day, 1)
    }
    while (activityMap.value.has(format(day, 'yyyy-MM-dd'))) {
      count++
      day = subDays(day, 1)
    }
    return count
  })

  // Last 52 weeks × 7 days grid for the activity calendar
  const calendarGrid = computed(() => {
    const grid: Array<{ date: string; active: boolean }> = []
    const today = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = subDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      grid.push({ date: dateStr, active: activityMap.value.has(dateStr) })
    }
    return grid
  })

  return { streak, activityMap, calendarGrid }
}
