<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Carga semanal — próximas 12 semanas</h3>
      <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-primary)]" />
          Planificado
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-px w-4 border-t-2 border-dashed border-[var(--color-text-muted)]" />
          Disponible
        </span>
      </div>
    </div>

    <!-- Chart area -->
    <div class="overflow-x-auto pb-1">
      <div class="relative" :style="{ minWidth: `${weeks.length * 44}px` }">

        <!-- Y-axis labels + chart body -->
        <div class="flex gap-0">
          <!-- Y-axis -->
          <div class="flex shrink-0 flex-col justify-between pb-6 pr-1 text-right" style="width: 28px; height: 160px">
            <span class="text-[10px] text-[var(--color-text-muted)]">{{ maxHours }}h</span>
            <span class="text-[10px] text-[var(--color-text-muted)]">{{ Math.round(maxHours / 2) }}h</span>
            <span class="text-[10px] text-[var(--color-text-muted)]">0</span>
          </div>

          <!-- Bars -->
          <div class="relative flex flex-1 items-end gap-1" style="height: 160px; padding-bottom: 24px">

            <!-- Dashed available-hours line (only if schedule is set) -->
            <div
              v-if="availableLineTop !== null"
              class="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-[var(--color-text-muted)]/50"
              :style="{ bottom: `calc(24px + ${availableLinePct}%)` }"
            />

            <!-- Individual week bars -->
            <div
              v-for="(week, i) in weeks"
              :key="i"
              class="group relative flex flex-1 flex-col items-center justify-end"
              style="min-width: 28px; height: 100%"
            >
              <!-- Bar -->
              <div
                class="w-full max-w-[32px] rounded-t-sm transition-all"
                :class="barClass(week)"
                :style="{ height: `${barHeightPct(week.plannedHours)}%` }"
              />

              <!-- X-axis label -->
              <span
                class="absolute bottom-0 left-1/2 -translate-x-1/2 truncate text-center text-[10px] leading-none"
                :class="week.isCurrentWeek
                  ? 'font-semibold text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'"
                style="max-width: 36px"
              >
                {{ week.label }}
              </span>

              <!-- Tooltip -->
              <div
                class="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs shadow-lg group-hover:block z-10"
              >
                <p class="font-semibold text-[var(--color-text)]">{{ week.label }}</p>
                <p class="text-[var(--color-text-muted)]">
                  Planificado: <span class="font-medium text-[var(--color-text)]">{{ week.plannedHours.toFixed(1) }}h</span>
                </p>
                <p v-if="week.availableHours > 0" class="text-[var(--color-text-muted)]">
                  Disponible: <span class="font-medium text-[var(--color-text)]">{{ week.availableHours.toFixed(1) }}h</span>
                </p>
                <p v-if="week.isOverloaded" class="font-semibold text-[var(--color-error)]">Sobrecargada</p>
                <p v-if="week.isCurrentWeek" class="font-medium text-[var(--color-primary)]">Semana actual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend note when no schedule -->
    <p v-if="noSchedule" class="mt-2 text-xs text-[var(--color-text-muted)] italic">
      Configura tu horario semanal para ver la línea de disponibilidad.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, startOfWeek, addWeeks, parseISO, isWithinInterval, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'
import { useSemesterStore } from '@/stores/semester'

const topicStore = useTopicStore()
const subjectStore = useSubjectStore()
const semesterStore = useSemesterStore()

interface WeekEntry {
  label: string
  plannedHours: number
  availableHours: number
  isCurrentWeek: boolean
  isOverloaded: boolean
}

const weeks = computed<WeekEntry[]>(() => {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const sch = semesterStore.activeSchedule
  const weeklyAvailable = Object.values(sch).reduce((a, b) => a + b, 0)

  return Array.from({ length: 12 }, (_, i) => {
    const start = addWeeks(weekStart, i)
    const end = addDays(start, 6)
    const label = format(start, 'd MMM', { locale: es })

    const topics = subjectStore.subjects.flatMap(sub =>
      topicStore.getBySubject(sub.$id).filter(t => {
        if (!t.planner_day) return false
        const d = parseISO(t.planner_day)
        return isWithinInterval(d, { start, end })
      })
    )

    const plannedHours = topics.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
    const isCurrentWeek = i === 0
    const isOverloaded = weeklyAvailable > 0 && plannedHours > weeklyAvailable

    return { label, plannedHours, availableHours: weeklyAvailable, isCurrentWeek, isOverloaded }
  })
})

const maxHours = computed(() =>
  Math.max(...weeks.value.map(w => Math.max(w.plannedHours, w.availableHours)), 1)
)

const noSchedule = computed(() =>
  weeks.value.every(w => w.availableHours === 0)
)

// Position of the available-hours dashed line as % from bottom of chart area
const availableLinePct = computed(() => {
  const avail = weeks.value[0]?.availableHours ?? 0
  if (avail === 0) return 0
  return (avail / maxHours.value) * 100
})

const availableLineTop = computed(() => {
  const avail = weeks.value[0]?.availableHours ?? 0
  return avail > 0 ? availableLinePct.value : null
})

function barHeightPct(plannedHours: number): number {
  if (maxHours.value === 0) return 0
  return Math.min((plannedHours / maxHours.value) * 100, 100)
}

function barClass(week: WeekEntry): string {
  if (week.isOverloaded) return 'bg-[var(--color-error)]'
  if (week.isCurrentWeek) return 'bg-[var(--color-primary)]'
  if (week.plannedHours === 0) return 'bg-[var(--color-border)]'
  return 'bg-[var(--color-primary)]/60'
}
</script>
