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
              </div>
              <span v-if="s.is_active" class="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium shrink-0">activo</span>
              <button
                v-else
                @click="semesterStore.setActive(s.$id)"
                class="text-xs text-[var(--color-primary)] hover:underline shrink-0"
              >
                Activar
              </button>
            </div>

            <!-- Create new semester form -->
            <div class="pt-2 border-t border-[var(--color-border)]">
              <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Nuevo semestre</p>
              <SemesterForm @saved="onSemesterSaved" @cancel="showSemesters = false" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GraduationCap, X } from 'lucide-vue-next'
import { useSemesterStore } from '@/stores/semester'
import { useSubjectStore } from '@/stores/subject'
import { useTopicStore } from '@/stores/topic'
import { usePecStore } from '@/stores/pec'
import { useExamStore } from '@/stores/exam'
import { usePlannerStore } from '@/stores/planner'
import { useStudySessionStore } from '@/stores/study-session'
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

const semesterStore = useSemesterStore()
const subjectStore = useSubjectStore()
const topicStore = useTopicStore()
const pecStore = usePecStore()
const examStore = useExamStore()
const plannerStore = usePlannerStore()
const sessionStore = useStudySessionStore()

const showSemesters = ref(false)

async function onSemesterSaved() {
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  showSemesters.value = false
}

onMounted(async () => {
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  for (const s of subjectStore.subjects) {
    await topicStore.fetchBySubject(s.$id)
  }
  await pecStore.fetchUpcoming()
  await examStore.fetchUpcoming()
  await plannerStore.fetchWeek()
  await sessionStore.fetchRecentDates()
})
</script>
