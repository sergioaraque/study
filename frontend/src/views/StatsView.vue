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

const semesterStore = useSemesterStore()
const topicStore = useTopicStore()

const loading = ref(false)
const selectedSemesterId = ref('')
const sessionsBySubject = ref<Record<string, StudySession[]>>({})
const semesterSubjects = ref<Subject[]>([])

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
