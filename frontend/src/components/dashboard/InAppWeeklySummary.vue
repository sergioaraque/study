<template>
  <Transition name="slide-down">
    <div
      v-if="showBanner"
      class="relative rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 p-4"
    >
      <!-- Dismiss button -->
      <button
        type="button"
        class="absolute right-3 top-3 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
        aria-label="Cerrar resumen semanal"
        @click="dismiss"
      >
        <X :size="16" />
      </button>

      <!-- Header -->
      <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        Resumen semanal
      </p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <!-- Last week stats -->
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p class="mb-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Semana pasada
          </p>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[var(--color-text)]">{{ lastWeekCompleted }}</span>
            <span class="text-xs text-[var(--color-text-muted)]">temas completados</span>
          </div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-lg font-semibold text-[var(--color-text)]">{{ lastWeekStudyDays }}</span>
            <span class="text-xs text-[var(--color-text-muted)]">días de estudio</span>
          </div>
        </div>

        <!-- This week upcoming -->
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p class="mb-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Esta semana
          </p>
          <div v-if="upcomingItems.length" class="space-y-1">
            <div
              v-for="item in upcomingItems.slice(0, 4)"
              :key="item.id"
              class="flex items-center justify-between gap-2 text-xs"
            >
              <span class="flex items-center gap-1.5 truncate text-[var(--color-text)]">
                <span
                  class="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  :class="item.type === 'exam' ? 'bg-[var(--color-error)]' : 'bg-[var(--color-warning)]'"
                />
                <span class="truncate">{{ item.label }}</span>
              </span>
              <span class="shrink-0 font-medium text-[var(--color-text-muted)]">{{ item.dateLabel }}</span>
            </div>
          </div>
          <p v-else class="text-xs italic text-[var(--color-text-muted)]">
            Sin PECs ni exámenes esta semana.
          </p>
        </div>

        <!-- Motivational note -->
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p class="mb-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Tu ritmo
          </p>
          <p class="text-sm text-[var(--color-text)] leading-snug">{{ motivationalNote }}</p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { format, subDays, parseISO, isAfter, getISOWeek, getISOWeekYear } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePecStore } from '@/stores/pec'
import { useExamStore } from '@/stores/exam'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'
import { useSemesterStore } from '@/stores/semester'
import { useStudySessionStore } from '@/stores/study-session'

const pecStore = usePecStore()
const examStore = useExamStore()
const topicStore = useTopicStore()
const subjectStore = useSubjectStore()
const semesterStore = useSemesterStore()
const sessionStore = useStudySessionStore()

// ── localStorage week key ────────────────────────────────────────────────────

function currentISOWeekKey(): string {
  const now = new Date()
  return `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`
}

const LS_KEY = 'lastSummaryWeek'
const showBanner = ref(false)

onMounted(() => {
  const currentKey = currentISOWeekKey()
  const lastKey = localStorage.getItem(LS_KEY)
  if (lastKey !== currentKey) {
    showBanner.value = true
    localStorage.setItem(LS_KEY, currentKey)
  }
})

function dismiss() {
  showBanner.value = false
}

// ── Last week: completed topics ──────────────────────────────────────────────

const lastWeekCompleted = computed(() => {
  const now = new Date()
  // "last week" = the ISO week that ended 7 days ago
  const lastWeekDate = subDays(now, 7)
  const weekYear = getISOWeekYear(lastWeekDate)
  const weekNum = getISOWeek(lastWeekDate)
  const weekKey = `${weekYear}-W${String(weekNum).padStart(2, '0')}`

  return subjectStore.subjects
    .flatMap(sub => topicStore.getBySubject(sub.$id))
    .filter(t => t.status === 'completado' && t.completed_week === weekKey)
    .length
})

// ── Last week: study days from session dates ─────────────────────────────────

const lastWeekStudyDays = computed(() => {
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)

  return sessionStore.recentDates.filter(dateStr => {
    try {
      const d = parseISO(dateStr)
      return isAfter(d, sevenDaysAgo) && !isAfter(d, now)
    } catch {
      return false
    }
  }).length
})

// ── This week: upcoming PECs + exams ────────────────────────────────────────

interface UpcomingItem {
  id: string
  label: string
  dateLabel: string
  type: 'pec' | 'exam'
}

const upcomingItems = computed<UpcomingItem[]>(() => {
  const now = new Date()
  const weekEnd = subDays(now, -7) // 7 days ahead

  const pecs: UpcomingItem[] = pecStore.upcomingPecs
    .filter(p => {
      if (!p.due_date) return false
      const d = parseISO(p.due_date)
      return !isAfter(now, d) && !isAfter(d, weekEnd)
    })
    .map(p => ({
      id: p.$id,
      label: p.title,
      dateLabel: format(parseISO(p.due_date!), "d MMM", { locale: es }),
      type: 'pec' as const,
    }))

  const exams: UpcomingItem[] = examStore.upcomingExams
    .map(e => ({ ...e, chosenDate: examStore.getChosenDate(e) }))
    .filter(e => {
      if (!e.chosenDate) return false
      const d = parseISO(e.chosenDate)
      return !isAfter(now, d) && !isAfter(d, weekEnd)
    })
    .map(e => ({
      id: e.$id,
      label: subjectStore.getById(e.subject_id)?.name ?? 'Examen',
      dateLabel: format(parseISO(e.chosenDate!), "d MMM", { locale: es }),
      type: 'exam' as const,
    }))

  return [...pecs, ...exams].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel))
})

// ── Motivational note (simplified pace check) ────────────────────────────────

const motivationalNote = computed(() => {
  const s = semesterStore.activeSemester
  if (!s?.start_date || !s?.end_date) return '¡Configura tu semestre para ver tu ritmo!'

  const allTopics = subjectStore.subjects.flatMap(sub => topicStore.getBySubject(sub.$id))
  if (allTopics.length === 0) return '¡Añade temas a tus asignaturas para empezar!'

  const completedTopics = allTopics.filter(t => t.status === 'completado').length
  const topicPct = Math.round((completedTopics / allTopics.length) * 100)

  if (lastWeekCompleted.value >= 3) {
    return `¡Buena semana! Completaste ${lastWeekCompleted.value} temas. Llevas el ${topicPct}% del temario. Sigue así.`
  }
  if (lastWeekCompleted.value === 0) {
    return `La semana pasada no completaste ningún tema. Llevas el ${topicPct}% del temario — ¡esta semana puedes recuperarlo!`
  }
  return `Completaste ${lastWeekCompleted.value} tema${lastWeekCompleted.value !== 1 ? 's' : ''} la semana pasada. Llevas el ${topicPct}% del temario. ¡A por más!`
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
