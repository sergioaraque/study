<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-[var(--color-text)]">Dashboard</h1>
        <p v-if="semesterStore.activeSemester" class="text-sm text-[var(--color-text-muted)] mt-0.5">
          {{ semesterStore.activeSemester.name }}
        </p>
      </div>
      <button @click="showSemesters = true" class="btn-secondary text-xs flex items-center gap-1.5">
        <GraduationCap :size="14" />
        Semestres
      </button>
    </div>

    <!-- No active semester warning -->
    <div v-if="!semesterStore.activeSemester && !semesterStore.loading" class="mb-6 p-4 rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10">
      <p class="text-sm text-[var(--color-text)] font-medium mb-1">No hay ningún semestre activo</p>
      <p class="text-xs text-[var(--color-text-muted)] mb-3">Crea un semestre para empezar a organizar tus asignaturas.</p>
      <button @click="showSemesters = true" class="btn-primary text-xs">Crear semestre</button>
    </div>

    <InAppWeeklySummary class="mb-4" />
    <PaceAlert class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <UpcomingPecs />
      <UpcomingExams />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <SubjectProgressList class="lg:col-span-2" />
      <div class="flex flex-col gap-4">
        <WeekSummary />
        <SubjectVisualProgressWidget />
        <WeeklyGoalWidget @open-settings="showSemesters = true" />
      </div>
    </div>

    <WeeklyLoadChart class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <SpacedReviewWidget />
      <StudyStreakCalendar />
    </div>

    <!-- Semester manager modal -->
    <Teleport to="body">
      <div
        v-if="showSemesters"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="showSemesters = false"
      >
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h2 class="text-base font-semibold text-[var(--color-text)]">Semestres</h2>
            <button @click="showSemesters = false" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X :size="18" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-3">
            <!-- Existing semesters -->
            <div
              v-for="s in semesterStore.semesters"
              :key="s.$id"
              class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              :class="s.is_active
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[var(--color-text)] truncate">{{ s.name }}</p>
                <p class="text-xs text-[var(--color-text-muted)]">{{ s.start_date?.slice(0, 10) }} → {{ s.end_date?.slice(0, 10) }}</p>
                <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Nota media: <strong class="text-[var(--color-text)]">{{ semesterAvgById[s.$id] != null ? semesterAvgById[s.$id]!.toFixed(2) : '—' }}</strong>
                </p>
              </div>
              <button
                @click="editingSemester = s"
                class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline shrink-0 flex items-center gap-1"
              >
                <Pencil :size="12" />
                Editar
              </button>
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="s.is_active
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                    : 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]'"
                >
                  {{ s.is_active ? 'activo' : 'finalizado' }}
                </span>
                <button
                  v-if="s.is_active"
                  @click="finishSemester(s.$id)"
                  class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
                >
                  Finalizar
                </button>
                <button
                  v-else
                  @click="activateSemester(s.$id)"
                  class="text-xs text-[var(--color-primary)] hover:underline shrink-0"
                >
                  Activar
                </button>
              </div>
            </div>

            <!-- Create or edit semester form -->
            <div class="pt-2 border-t border-[var(--color-border)]">
              <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                {{ editingSemester ? 'Editar semestre' : 'Nuevo semestre' }}
              </p>
              <SemesterForm
                :semester="editingSemester ?? undefined"
                @saved="onSemesterSaved"
                @cancel="editingSemester ? editingSemester = null : showSemesters = false"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GraduationCap, Pencil, X } from 'lucide-vue-next'
import { useSemesterStore } from '@/stores/semester'
import { useSubjectStore } from '@/stores/subject'
import { useTopicStore } from '@/stores/topic'
import { usePecStore } from '@/stores/pec'
import { useExamStore } from '@/stores/exam'
import { usePlannerStore } from '@/stores/planner'
import { useStudySessionStore } from '@/stores/study-session'
import { useAuthStore } from '@/stores/auth'
import { subjectCol } from '@/lib/collections'
import type { Semester, Subject } from '@/types'
import UpcomingPecs from '@/components/dashboard/UpcomingPecs.vue'
import UpcomingExams from '@/components/dashboard/UpcomingExams.vue'
import SubjectProgressList from '@/components/dashboard/SubjectProgressList.vue'
import WeekSummary from '@/components/dashboard/WeekSummary.vue'
import StudyStreakCalendar from '@/components/dashboard/StudyStreakCalendar.vue'
import WeeklyLoadChart from '@/components/dashboard/WeeklyLoadChart.vue'
import PaceAlert from '@/components/dashboard/PaceAlert.vue'
import SpacedReviewWidget from '@/components/dashboard/SpacedReviewWidget.vue'
import InAppWeeklySummary from '@/components/dashboard/InAppWeeklySummary.vue'
import SemesterForm from '@/components/semesters/SemesterForm.vue'
import WeeklyGoalWidget from '@/components/dashboard/WeeklyGoalWidget.vue'
import SubjectVisualProgressWidget from '@/components/dashboard/SubjectVisualProgressWidget.vue'

const semesterStore = useSemesterStore()
const subjectStore = useSubjectStore()
const topicStore = useTopicStore()
const pecStore = usePecStore()
const examStore = useExamStore()
const plannerStore = usePlannerStore()
const sessionStore = useStudySessionStore()
const authStore = useAuthStore()

const showSemesters = ref(false)
const allSubjects = ref<Subject[]>([])
const editingSemester = ref<Semester | null>(null)

function bestExamGrade(subject: Subject): number | null {
  const grades = [subject.grade_exam_c1, subject.grade_exam_c2].filter((g): g is number => g != null)
  return grades.length ? Math.max(...grades) : null
}

function computedFinal(subject: Subject): number | null {
  const pec = subject.grade_pec
  const exam = bestExamGrade(subject)
  if (exam == null) return null
  if (pec == null) return exam
  return subject.pec_weight * pec + (1 - subject.pec_weight) * exam
}

function effectiveFinal(subject: Subject): number | null {
  return subject.grade_final ?? computedFinal(subject)
}

const semesterAvgById = computed<Record<string, number | null>>(() => {
  const map: Record<string, number | null> = {}
  for (const semester of semesterStore.semesters) {
    const graded = allSubjects.value.filter((subject) => {
      if (subject.semester_id !== semester.$id) return false
      return effectiveFinal(subject) != null
    })
    if (!graded.length) {
      map[semester.$id] = null
      continue
    }
    const weighted = graded.reduce((sum, subject) => sum + (effectiveFinal(subject) ?? 0) * subject.credits, 0)
    const credits = graded.reduce((sum, subject) => sum + subject.credits, 0)
    map[semester.$id] = credits > 0 ? weighted / credits : null
  }
  return map
})

async function onSemesterSaved() {
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  allSubjects.value = await subjectCol.listByUser(authStore.userId)
  editingSemester.value = null
}

async function finishSemester(id: string) {
  if (!window.confirm('¿Seguro que quieres finalizar este semestre? Podrás reactivarlo después.')) return
  await semesterStore.archive(id)
  await Promise.all([semesterStore.fetchAll(), subjectStore.fetchActive()])
}

async function activateSemester(id: string) {
  await semesterStore.setActive(id)
  await subjectStore.fetchActive()
  await Promise.all(subjectStore.subjects.map((subject) => topicStore.fetchBySubject(subject.$id)))
  await Promise.all([plannerStore.fetchWeek(), sessionStore.fetchRecentDates()])
}

onMounted(async () => {
  await Promise.all([semesterStore.fetchAll(), subjectStore.fetchActive()])
  allSubjects.value = await subjectCol.listByUser(authStore.userId)
  await Promise.all([
    ...subjectStore.subjects.map((s) => topicStore.fetchBySubject(s.$id)),
    pecStore.fetchUpcoming(),
    examStore.fetchUpcoming(),
    plannerStore.fetchWeek(),
    sessionStore.fetchRecentDates(),
  ])
})
</script>
