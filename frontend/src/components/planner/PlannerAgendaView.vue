<template>
  <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" :class="compact ? 'p-3 md:p-4' : 'p-4 md:p-5'">
    <div class="flex flex-col gap-3 mb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-[var(--color-text)]">Agenda del mes</h2>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">
            Scroll vertical por días, agrupados por semana.
          </p>
        </div>
        <span class="text-[11px] px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
          {{ agendaDays.length }} días
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="option in FILTER_OPTIONS"
          :key="option.value"
          @click="filterMode = option.value"
          class="text-xs px-2.5 py-1.5 rounded-full border transition-colors"
          :class="filterMode === option.value
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'"
        >
          {{ option.label }}
        </button>

        <div class="ml-auto flex items-center gap-2">
          <label class="text-[11px] text-[var(--color-text-muted)]" for="agenda-month-picker">Mes</label>
          <input
            id="agenda-month-picker"
            type="month"
            class="text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-[var(--color-text)]"
            :value="monthInput"
            @change="onMonthChange"
          />
        </div>
      </div>
    </div>

    <div v-if="agendaDays.length" class="max-h-[calc(100vh-17rem)] overflow-y-auto pr-1 space-y-4">
      <section v-for="week in agendaWeeks" :key="week.key" class="space-y-2">
        <header class="sticky top-0 z-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur px-3 py-2">
          <p class="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">Semana</p>
          <p class="text-xs font-semibold text-[var(--color-text)]">{{ week.label }}</p>
        </header>

        <section
          v-for="day in week.days"
          :key="format(day, 'yyyy-MM-dd')"
          class="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)]"
        >
          <header class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]" :class="compact ? 'px-2.5 py-2' : 'px-3 py-2.5'">
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{{ dayLabel(day) }}</p>
              <p class="text-sm font-semibold text-[var(--color-text)] truncate">{{ dayTitle(day) }}</p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="availableHours(day) > 0"
                class="text-[11px] px-2 py-1 rounded-full"
                :class="loadStateClass(day)"
              >
                {{ plannedHours(day).toFixed(1) }}h / {{ availableHours(day).toFixed(1) }}h
              </span>
              <span
                v-if="isToday(day)"
                class="text-[11px] px-2 py-1 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
              >
                Hoy
              </span>
            </div>
          </header>

          <div v-if="availableHours(day) > 0" :class="compact ? 'px-2.5 pt-1.5' : 'px-3 pt-2'">
            <div class="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="loadBarClass(day)"
                :style="{ width: `${Math.min(loadRatio(day) * 100, 100)}%` }"
              />
            </div>
          </div>

          <div :class="compact ? 'p-2.5 space-y-2.5' : 'p-3 md:p-4 space-y-3'">
            <div v-if="showTasks && topicsForDay(day).length">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Tareas</p>
              <div class="space-y-2">
                <article
                  v-for="topic in topicsForDay(day)"
                  :key="topic.$id"
                  class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                  :class="compact ? 'px-2.5 py-2' : 'px-3 py-2'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-[var(--color-text)] truncate">
                        T{{ topic.number }}. {{ topic.title }}
                      </p>
                      <p class="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                        {{ subjectName(topic.subject_id) }}
                      </p>
                    </div>
                    <span class="text-[11px] px-2 py-1 rounded-full shrink-0" :class="topicStatusClass(topic.status)">
                      {{ topicStatusLabel(topic.status) }}
                    </span>
                  </div>
                  <p v-if="topic.estimated_hours" class="text-[11px] text-[var(--color-text-muted)] mt-2">
                    {{ topic.estimated_hours.toFixed(1) }}h previstas
                  </p>
                </article>
              </div>
            </div>

            <div v-if="showTutorings && tutoringsForDay(day).length">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Tutorías</p>
              <div class="space-y-2">
                <article
                  v-for="session in tutoringsForDay(day)"
                  :key="session.$id"
                  class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                  :class="compact ? 'px-2.5 py-2' : 'px-3 py-2'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-[var(--color-text)] truncate">
                        {{ subjectName(session.subject_id) }}
                      </p>
                      <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {{ sessionTime(session.date) }}
                      </p>
                    </div>
                    <span class="text-[11px] px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                      Tutoría
                    </span>
                  </div>
                  <p v-if="session.notes" class="text-xs text-[var(--color-text-muted)] mt-2 whitespace-pre-line">
                    {{ session.notes }}
                  </p>
                </article>
              </div>
            </div>

            <div v-if="isDayEmpty(day)" class="text-xs text-[var(--color-text-muted)] py-1">
              No hay elementos para este filtro en este día.
            </div>
          </div>
        </section>
      </section>
    </div>

    <div v-else class="rounded-xl border border-dashed border-[var(--color-border)] text-center py-10 px-4">
      <p class="text-sm font-medium text-[var(--color-text)]">No hay resultados para este filtro</p>
      <p class="text-xs text-[var(--color-text-muted)] mt-1">Prueba cambiando el mes o mostrando todo.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { endOfWeek, format, getISODay, isSameMonth, isToday as dateFnsIsToday, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePlannerStore } from '@/stores/planner'
import { useSemesterStore } from '@/stores/semester'
import type { Subject } from '@/types'

const props = defineProps<{
  subjects: Record<string, Subject>
  compact?: boolean
}>()

const planner = usePlannerStore()
const semesterStore = useSemesterStore()
const filterMode = ref<'all' | 'tasks' | 'tutorings'>('all')

const FILTER_OPTIONS: Array<{ value: 'all' | 'tasks' | 'tutorings'; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'tasks', label: 'Tareas' },
  { value: 'tutorings', label: 'Tutorías' },
]

const visibleDays = computed(() =>
  planner.monthCalendarDays.filter((day) => isSameMonth(day, planner.currentMonth))
)

const agendaDays = computed(() => visibleDays.value.filter((day) => shouldIncludeDay(day)))

const agendaWeeks = computed(() => {
  const groups: Array<{ key: string; label: string; days: Date[] }> = []
  for (const day of agendaDays.value) {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(day, { weekStartsOn: 1 })
    const key = format(weekStart, 'yyyy-MM-dd')
    const label = `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
    const existing = groups[groups.length - 1]
    if (!existing || existing.key !== key) {
      groups.push({ key, label, days: [day] })
      continue
    }
    existing.days.push(day)
  }
  return groups
})

const monthInput = computed(() => format(planner.currentMonth, 'yyyy-MM'))
const showTasks = computed(() => filterMode.value === 'all' || filterMode.value === 'tasks')
const showTutorings = computed(() => filterMode.value === 'all' || filterMode.value === 'tutorings')

const DAY_KEYS: Record<number, 'hours_mon' | 'hours_tue' | 'hours_wed' | 'hours_thu' | 'hours_fri' | 'hours_sat' | 'hours_sun'> = {
  1: 'hours_mon',
  2: 'hours_tue',
  3: 'hours_wed',
  4: 'hours_thu',
  5: 'hours_fri',
  6: 'hours_sat',
  7: 'hours_sun',
}

function availableHours(day: Date): number {
  const schedule = semesterStore.activeSchedule
  return schedule[DAY_KEYS[getISODay(day)]] ?? 0
}

function plannedHours(day: Date): number {
  return planner.topicsForDay(day, 'month').reduce((sum, topic) => sum + (topic.estimated_hours ?? 0), 0)
}

function loadRatio(day: Date): number {
  const hours = availableHours(day)
  if (hours <= 0) return 0
  return plannedHours(day) / hours
}

function loadStateClass(day: Date): string {
  const ratio = loadRatio(day)
  if (ratio > 1) return 'bg-[var(--color-error)]/15 text-[var(--color-error)]'
  if (ratio >= 0.85) return 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
  return 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
}

function loadBarClass(day: Date): string {
  const ratio = loadRatio(day)
  if (ratio > 1) return 'bg-[var(--color-error)]'
  if (ratio >= 0.85) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-success)]'
}

function dayLabel(day: Date): string {
  return format(day, 'EEEE')
}

function dayTitle(day: Date): string {
  return format(day, "d 'de' MMMM yyyy")
}

function isToday(day: Date): boolean {
  return dateFnsIsToday(day)
}

function topicsForDay(day: Date) {
  return planner.topicsForDay(day, 'month')
}

function tutoringsForDay(day: Date) {
  return planner.tutoringsForDay(day, 'month')
}

function hasTasks(day: Date): boolean {
  return topicsForDay(day).length > 0
}

function hasTutorings(day: Date): boolean {
  return tutoringsForDay(day).length > 0
}

function shouldIncludeDay(day: Date): boolean {
  if (filterMode.value === 'tasks') return hasTasks(day)
  if (filterMode.value === 'tutorings') return hasTutorings(day)
  return true
}

function subjectName(subjectId: string): string {
  return props.subjects[subjectId]?.name ?? 'Asignatura'
}

function topicStatusClass(status: string): string {
  if (status === 'completado') return 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
  if (status === 'en progreso' || status === 'en_progreso') return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
  return 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
}

function topicStatusLabel(status: string): string {
  if (status === 'completado') return 'Completado'
  if (status === 'en progreso' || status === 'en_progreso') return 'En progreso'
  return 'Pendiente'
}

function isDayEmpty(day: Date): boolean {
  const tasksVisible = showTasks.value && hasTasks(day)
  const tutoringsVisible = showTutorings.value && hasTutorings(day)
  return !tasksVisible && !tutoringsVisible
}

function onMonthChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (!value) return
  planner.currentMonth = startOfMonth(new Date(`${value}-01T00:00:00`))
  planner.fetchMonth()
}

function sessionTime(value: string): string {
  return format(new Date(value), 'HH:mm')
}
</script>