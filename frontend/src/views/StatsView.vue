<template>
  <div>
    <h1 class="text-xl font-semibold text-[var(--color-text)] mb-6">Estadísticas</h1>

    <div v-if="loading" class="text-[var(--color-text-muted)] text-sm">Cargando…</div>

    <template v-else>
      <!-- Semester selector -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          v-for="s in semesterStore.semesters"
          :key="s.$id"
          @click="selectedSemesterId = s.$id"
          class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border"
          :class="selectedSemesterId === s.$id
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        >
          {{ s.name }}
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-[var(--color-primary)]">{{ semesterStats.completedTopics }}</p>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">Temas completados</p>
          <p class="text-xs text-[var(--color-text-muted)]">de {{ semesterStats.totalTopics }}</p>
        </div>
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-[var(--color-success)]">{{ semesterStats.studyHours }}h</p>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">Horas estudiadas</p>
        </div>
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-[var(--color-text)]">{{ semesterStats.avgPecGrade ?? '—' }}</p>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">Nota media PECs</p>
        </div>
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-[var(--color-text)]">{{ semesterStats.completionPct }}%</p>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">% completado</p>
        </div>
      </div>

      <!-- Visual progress by subject -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
        <div class="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Progreso visual por asignatura</h2>
          <span class="text-xs text-[var(--color-text-muted)]">Semáforo según ritmo del semestre</span>
        </div>

        <div v-if="!visualRows.length" class="px-4 py-8 text-center text-xs text-[var(--color-text-muted)] italic">
          No hay asignaturas para mostrar.
        </div>

        <div v-else class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div
            v-for="row in visualRows"
            :key="row.subject.$id"
            class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[var(--color-text)] truncate">{{ row.subject.name }}</p>
                <p class="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {{ row.completedTopics }}/{{ row.totalTopics }} temas · {{ row.studyHours.toFixed(1) }}h reales
                </p>
              </div>
              <span
                class="text-[11px] px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                :class="row.riskLevel === 'ok'
                  ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                  : row.riskLevel === 'warning'
                    ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                    : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'"
              >
                {{ row.riskLabel }}
              </span>
            </div>

            <div class="flex items-center gap-3">
              <div class="relative w-14 h-14 shrink-0 rounded-full p-1" :style="progressRingStyle(row.progressPct)">
                <div class="w-full h-full rounded-full bg-[var(--color-surface)] grid place-items-center border border-[var(--color-border)]">
                  <span class="text-[11px] font-semibold text-[var(--color-text)]">{{ row.progressPct }}%</span>
                </div>
              </div>

              <div class="flex-1 space-y-2">
                <div>
                  <div class="flex items-center justify-between text-[11px] mb-1">
                    <span class="text-[var(--color-text-muted)]">Temario</span>
                    <span class="text-[var(--color-text)]">{{ row.topicPct }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div class="h-full bg-[var(--color-primary)]" :style="{ width: `${row.topicPct}%` }" />
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-[11px] mb-1">
                    <span class="text-[var(--color-text-muted)]">Horas vs estimadas</span>
                    <span class="text-[var(--color-text)]">{{ row.hoursPct }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div class="h-full bg-[var(--color-success)]" :style="{ width: `${row.hoursPct}%` }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Heatmap -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
        <div class="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Heatmap de estudio (últimos 21 días)</h2>
        </div>

        <div class="p-4 overflow-x-auto">
          <div v-if="!visualRows.length" class="text-xs text-[var(--color-text-muted)] italic">Sin datos de sesiones.</div>
          <div v-else class="min-w-[760px]">
            <div class="grid gap-1" :style="{ gridTemplateColumns: `180px repeat(${heatmapDays.length}, minmax(0, 1fr))` }">
              <div class="text-[10px] text-[var(--color-text-muted)]" />
              <div
                v-for="day in heatmapDays"
                :key="`head-${day.key}`"
                class="text-[10px] text-center text-[var(--color-text-muted)]"
              >
                {{ day.label }}
              </div>

              <template v-for="row in visualRows" :key="`row-${row.subject.$id}`">
                <div class="text-xs text-[var(--color-text)] truncate pr-2 self-center">{{ row.subject.name }}</div>
                <div
                  v-for="day in heatmapDays"
                  :key="`${row.subject.$id}-${day.key}`"
                  class="h-6 rounded"
                  :title="`${row.subject.name} · ${day.key}: ${heatmapHours(row.subject.$id, day.key).toFixed(1)}h`"
                  :style="{ backgroundColor: heatmapCellColor(row.subject.$id, day.key) }"
                />
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Plan vs real -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
        <div class="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Plan vs real acumulado</h2>
          <select
            v-model="trendSubjectId"
            class="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text)]"
          >
            <option value="">Selecciona asignatura</option>
            <option v-for="row in visualRows" :key="`opt-${row.subject.$id}`" :value="row.subject.$id">
              {{ row.subject.name }}
            </option>
          </select>
        </div>

        <div class="p-4">
          <div v-if="!trendSeries" class="text-xs text-[var(--color-text-muted)] italic">Sin datos suficientes para mostrar la curva.</div>
          <div v-else>
            <svg viewBox="0 0 640 220" class="w-full h-auto">
              <line x1="24" y1="16" x2="24" y2="194" stroke="var(--color-border)" stroke-width="1" />
              <line x1="24" y1="194" x2="616" y2="194" stroke="var(--color-border)" stroke-width="1" />
              <polyline
                :points="trendSeries.planPoints"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                :points="trendSeries.realPoints"
                fill="none"
                stroke="var(--color-success)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(pt, i) in trendSeries.points"
                :key="`pt-${i}`"
                :cx="pt.x"
                :cy="pt.planY"
                r="2.2"
                fill="var(--color-primary)"
              />
              <circle
                v-for="(pt, i) in trendSeries.points"
                :key="`rt-${i}`"
                :cx="pt.x"
                :cy="pt.realY"
                r="2.2"
                fill="var(--color-success)"
              />
            </svg>

            <div class="flex flex-wrap gap-4 text-xs mt-3">
              <span class="flex items-center gap-1 text-[var(--color-text-muted)]"><span class="w-2 h-2 rounded-full bg-[var(--color-primary)]" /> Plan</span>
              <span class="flex items-center gap-1 text-[var(--color-text-muted)]"><span class="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Real</span>
              <span class="text-[var(--color-text-muted)]">Últimas 6 semanas</span>
            </div>

            <div class="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div v-for="p in trendSeries.points" :key="`wk-${p.label}`" class="text-[10px] text-[var(--color-text-muted)]">
                <p class="font-semibold text-[var(--color-text)]">{{ p.label }}</p>
                <p>P: {{ p.plan.toFixed(1) }}h</p>
                <p>R: {{ p.real.toFixed(1) }}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-subject breakdown -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
        <div class="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Por asignatura</h2>
        </div>
        <div class="divide-y divide-[var(--color-border)]">
          <div
            v-for="row in subjectRows"
            :key="row.subject.$id"
            class="px-4 py-3"
          >
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="text-sm font-medium text-[var(--color-text)]">{{ row.subject.name }}</span>
                <span class="text-xs text-[var(--color-text-muted)] ml-2">{{ row.subject.credits }} ECTS</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span>{{ row.studyHours }}h</span>
                <span v-if="row.subject.grade_pec !== undefined" class="text-[var(--color-text)]">
                  PEC: <strong>{{ row.subject.grade_pec }}</strong>
                </span>
                <span v-if="row.subject.grade_final !== undefined" class="text-[var(--color-primary)] font-semibold">
                  Final: {{ row.subject.grade_final }}
                </span>
              </div>
            </div>
            <!-- Topic progress bar -->
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  class="h-full rounded-full bg-[var(--color-primary)] transition-all"
                  :style="{ width: `${row.topicPct}%` }"
                />
              </div>
              <span class="text-xs text-[var(--color-text-muted)] shrink-0 w-16 text-right">
                {{ row.completedTopics }}/{{ row.totalTopics }} temas
              </span>
            </div>
          </div>

          <div v-if="!subjectRows.length" class="px-4 py-8 text-center text-xs text-[var(--color-text-muted)] italic">
            No hay datos para este semestre.
          </div>
        </div>
      </div>

      <!-- Semester comparison -->
      <div v-if="semesterStore.semesters.length > 1" class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Comparativa semestres</h2>
        </div>
        <div class="p-4 flex gap-4 items-end overflow-x-auto">
          <div
            v-for="bar in semesterBars"
            :key="bar.id"
            class="flex flex-col items-center gap-1 min-w-16"
          >
            <span class="text-xs font-semibold text-[var(--color-text)]">{{ bar.pct }}%</span>
            <div class="w-10 rounded-t transition-all" :style="{ height: `${bar.height}px`, backgroundColor: bar.color }" />
            <span class="text-[10px] text-[var(--color-text-muted)] text-center leading-tight max-w-16">{{ bar.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSemesterStore } from '@/stores/semester'
import { useTopicStore } from '@/stores/topic'
import { studySessionCol, subjectCol } from '@/lib/collections'
import type { Subject, StudySession } from '@/types'
import {
  addDays,
  addWeeks,
  eachWeekOfInterval,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

const semesterStore = useSemesterStore()
const topicStore = useTopicStore()

const loading = ref(false)
const selectedSemesterId = ref('')
const sessionsBySubject = ref<Record<string, StudySession[]>>({})
const semesterSubjects = ref<Subject[]>([])
const trendSubjectId = ref('')

// Load semester subjects when selection changes
watch(selectedSemesterId, async (id) => {
  if (!id) return
  loading.value = true
  try {
    const subjects = await subjectCol.listBySemester(id)
    semesterSubjects.value = subjects
    // Load topics + sessions for each subject
    await Promise.all(subjects.map(async (s) => {
      await topicStore.fetchBySubject(s.$id)
      const sessions = await studySessionCol.listBySubject(s.$id)
      sessionsBySubject.value[s.$id] = sessions
    }))
  } finally {
    loading.value = false
  }
}, { immediate: false })

onMounted(async () => {
  await semesterStore.fetchAll()
  const active = semesterStore.activeSemester
  selectedSemesterId.value = active?.$id ?? semesterStore.semesters[0]?.$id ?? ''
})

const subjectRows = computed(() =>
  semesterSubjects.value.map((subject) => {
    const topics = topicStore.getBySubject(subject.$id)
    const completedTopics = topics.filter((t) => t.status === 'completado').length
    const totalTopics = topics.length
    const topicPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
    const sessions = sessionsBySubject.value[subject.$id] ?? []
    const studyHours = Math.round(sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60 * 10) / 10
    return { subject, completedTopics, totalTopics, topicPct, studyHours }
  })
)

watch(subjectRows, (rows) => {
  if (!rows.length) {
    trendSubjectId.value = ''
    return
  }
  if (!rows.some((r) => r.subject.$id === trendSubjectId.value)) {
    trendSubjectId.value = rows[0].subject.$id
  }
}, { immediate: true })

const semesterStats = computed(() => {
  const rows = subjectRows.value
  const completedTopics = rows.reduce((s, r) => s + r.completedTopics, 0)
  const totalTopics = rows.reduce((s, r) => s + r.totalTopics, 0)
  const studyHours = Math.round(rows.reduce((s, r) => s + r.studyHours, 0) * 10) / 10
  const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  const pecGrades = semesterSubjects.value
    .map((s) => s.grade_pec)
    .filter((g): g is number => g !== undefined)
  const avgPecGrade = pecGrades.length
    ? Math.round((pecGrades.reduce((a, b) => a + b, 0) / pecGrades.length) * 10) / 10
    : undefined

  return { completedTopics, totalTopics, studyHours, completionPct, avgPecGrade }
})

const selectedSemester = computed(() =>
  semesterStore.semesters.find((s) => s.$id === selectedSemesterId.value) ?? null
)

function expectedProgressPct(): number {
  if (!selectedSemester.value) return 0
  const start = parseISO(selectedSemester.value.start_date)
  const end = parseISO(selectedSemester.value.end_date)
  const today = new Date()
  if (today <= start) return 0
  if (today >= end) return 100
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = today.getTime() - start.getTime()
  return Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)))
}

const visualRows = computed(() => {
  const expected = expectedProgressPct()
  const today = format(new Date(), 'yyyy-MM-dd')

  return subjectRows.value.map((row) => {
    const topics = topicStore.getBySubject(row.subject.$id)
    const plannedHours = topics.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
    const hoursPct = plannedHours > 0
      ? Math.min(100, Math.round((row.studyHours / plannedHours) * 100))
      : row.topicPct
    const progressPct = Math.round(row.topicPct * 0.7 + hoursPct * 0.3)
    const overdueCount = topics.filter((t) => t.status !== 'completado' && t.planner_day && t.planner_day < today).length

    let riskLevel: 'ok' | 'warning' | 'risk' = 'ok'
    if (overdueCount > 2 || progressPct + 15 < expected) riskLevel = 'risk'
    else if (overdueCount > 0 || progressPct + 5 < expected) riskLevel = 'warning'

    return {
      ...row,
      plannedHours,
      hoursPct,
      progressPct,
      overdueCount,
      riskLevel,
      riskLabel: riskLevel === 'ok' ? 'En ritmo' : riskLevel === 'warning' ? 'Ajustado' : 'Riesgo',
    }
  })
})

const heatmapDays = computed(() => {
  const end = startOfDay(new Date())
  const start = addDays(end, -20)
  return Array.from({ length: 21 }, (_, i) => {
    const day = addDays(start, i)
    return {
      key: format(day, 'yyyy-MM-dd'),
      label: format(day, 'd/M', { locale: es }),
      day,
    }
  })
})

function heatmapMinutes(subjectId: string, day: string): number {
  const sessions = sessionsBySubject.value[subjectId] ?? []
  return sessions
    .filter((s) => s.session_date === day)
    .reduce((sum, s) => sum + s.duration_minutes, 0)
}

function heatmapHours(subjectId: string, day: string): number {
  return Math.round((heatmapMinutes(subjectId, day) / 60) * 10) / 10
}

const maxHeatmapMinutes = computed(() => {
  let max = 0
  for (const row of visualRows.value) {
    for (const day of heatmapDays.value) {
      max = Math.max(max, heatmapMinutes(row.subject.$id, day.key))
    }
  }
  return max
})

function heatmapCellColor(subjectId: string, day: string): string {
  const minutes = heatmapMinutes(subjectId, day)
  if (!minutes) return 'color-mix(in oklab, var(--color-border) 55%, transparent)'
  const max = maxHeatmapMinutes.value || 1
  const ratio = minutes / max
  const alpha = 0.15 + ratio * 0.75
  return `color-mix(in oklab, var(--color-primary) ${Math.round(alpha * 100)}%, transparent)`
}

function progressRingStyle(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct))
  return {
    background: `conic-gradient(var(--color-primary) ${clamped}%, color-mix(in oklab, var(--color-border) 85%, transparent) ${clamped}% 100%)`,
  }
}

const trendSeries = computed(() => {
  const subjectId = trendSubjectId.value
  if (!subjectId) return null

  const now = new Date()
  const firstWeek = startOfWeek(addWeeks(now, -5), { weekStartsOn: 1 })
  const lastWeek = endOfWeek(now, { weekStartsOn: 1 })
  const weeks = eachWeekOfInterval({ start: firstWeek, end: lastWeek }, { weekStartsOn: 1 })
  if (!weeks.length) return null

  const topics = topicStore.getBySubject(subjectId)
  const sessions = sessionsBySubject.value[subjectId] ?? []

  let planAcc = 0
  let realAcc = 0

  const points = weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const plan = topics
      .filter((t) => t.planner_day)
      .filter((t) => {
        const day = parseISO(t.planner_day as string)
        return isWithinInterval(day, { start: weekStart, end: weekEnd })
      })
      .reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)

    const real = sessions
      .filter((s) => {
        const day = parseISO(s.session_date)
        return isWithinInterval(day, { start: weekStart, end: weekEnd })
      })
      .reduce((sum, s) => sum + s.duration_minutes, 0) / 60

    planAcc += plan
    realAcc += real
    return {
      label: format(weekStart, "d MMM", { locale: es }),
      plan: planAcc,
      real: realAcc,
    }
  })

  const maxY = Math.max(...points.map((p) => Math.max(p.plan, p.real)), 1)
  const left = 24
  const right = 616
  const top = 16
  const bottom = 194
  const width = right - left
  const height = bottom - top

  const normalized = points.map((p, i) => {
    const x = left + (points.length === 1 ? width / 2 : (i / (points.length - 1)) * width)
    const planY = bottom - (p.plan / maxY) * height
    const realY = bottom - (p.real / maxY) * height
    return { ...p, x, planY, realY }
  })

  return {
    points: normalized,
    planPoints: normalized.map((p) => `${p.x},${p.planY}`).join(' '),
    realPoints: normalized.map((p) => `${p.x},${p.realY}`).join(' '),
  }
})

// Comparison bars — completion % per semester (from archived data)
const semesterBars = computed(() =>
  semesterStore.semesters.slice(0, 6).map((s, i) => ({
    id: s.$id,
    label: s.name.replace(/\d{4}-\d{4}\s*/g, '').trim() || s.name,
    pct: s.$id === selectedSemesterId.value ? semesterStats.value.completionPct : 0,
    height: Math.max(4, ((s.$id === selectedSemesterId.value ? semesterStats.value.completionPct : 0) / 100) * 80),
    color: s.is_active ? 'var(--color-primary)' : `hsl(${220 + i * 30}, 60%, 55%)`,
  }))
)
</script>
