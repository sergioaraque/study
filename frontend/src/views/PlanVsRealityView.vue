<template>
  <div>
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <h1 class="text-xl font-semibold text-[var(--color-text)]">Plan vs Realidad</h1>
      <div class="flex items-center gap-2">
        <button @click="prevWeek" class="btn-secondary p-1.5"><ChevronLeft :size="16" /></button>
        <span class="text-sm font-medium text-[var(--color-text)] min-w-44 text-center">{{ weekLabel }}</span>
        <button @click="nextWeek" class="btn-secondary p-1.5"><ChevronRight :size="16" /></button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Planned -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <h2 class="text-sm font-semibold text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span> Planificado
        </h2>
        <div v-if="planned.length === 0" class="text-xs text-[var(--color-text-muted)] italic">
          Nada planificado esta semana
        </div>
        <div v-else class="space-y-2">
          <PlanRealityRow
            v-for="topic in planned"
            :key="topic.$id"
            :topic="topic"
            :subject-name="subjectName(topic.subject_id)"
            mode="planned"
          />
        </div>
      </div>

      <!-- Completed -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <h2 class="text-sm font-semibold text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[var(--color-success)]"></span> Completado
        </h2>
        <div v-if="completed.length === 0" class="text-xs text-[var(--color-text-muted)] italic">
          Nada completado esta semana
        </div>
        <div v-else class="space-y-2">
          <PlanRealityRow
            v-for="topic in completed"
            :key="topic.$id"
            :topic="topic"
            :subject-name="subjectName(topic.subject_id)"
            mode="completed"
          />
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="mt-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
      <div class="flex items-center gap-6 text-sm">
        <span class="text-[var(--color-text-muted)]">Planificados: <strong class="text-[var(--color-text)]">{{ planned.length }}</strong></span>
        <span class="text-[var(--color-text-muted)]">Completados: <strong class="text-[var(--color-success)]">{{ completed.length }}</strong></span>
        <span class="text-[var(--color-text-muted)]">Pendientes: <strong class="text-[var(--color-danger)]">{{ pending.length }}</strong></span>
        <BaseProgressBar :current="completed.length" :total="planned.length" class="flex-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format, addWeeks, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'
import PlanRealityRow from '@/components/planner/PlanRealityRow.vue'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'

const topicStore = useTopicStore()
const subjectStore = useSubjectStore()

const currentWeekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))

const weekLabel = computed(() =>
  `${format(currentWeekStart.value, "d MMM", { locale: es })} – ${format(addDays(currentWeekStart.value, 6), "d MMM yyyy", { locale: es })}`
)

function isoWeek(date: Date) {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

const currentWeekStr = computed(() => isoWeek(currentWeekStart.value))

const allTopics = computed(() =>
  subjectStore.subjects.flatMap((s) => topicStore.getBySubject(s.$id))
)

const planned = computed(() =>
  allTopics.value.filter((t) => t.planned_week === currentWeekStr.value)
)

const completed = computed(() =>
  allTopics.value.filter((t) => t.completed_week === currentWeekStr.value)
)

const pending = computed(() =>
  planned.value.filter((t) => t.completed_week !== currentWeekStr.value)
)

function subjectName(subjectId: string) {
  return subjectStore.getById(subjectId)?.name ?? ''
}

function prevWeek() { currentWeekStart.value = addWeeks(currentWeekStart.value, -1) }
function nextWeek() { currentWeekStart.value = addWeeks(currentWeekStart.value, 1) }

onMounted(async () => {
  await subjectStore.fetchActive()
  for (const s of subjectStore.subjects) {
    await topicStore.fetchBySubject(s.$id)
  }
})
</script>
