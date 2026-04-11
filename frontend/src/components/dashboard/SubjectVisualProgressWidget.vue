<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Radar de asignaturas</h3>
      <RouterLink to="/stats" class="text-xs text-[var(--color-primary)] hover:underline">Ver analitica</RouterLink>
    </div>

    <div v-if="!rows.length" class="text-xs text-[var(--color-text-muted)] italic">
      No hay datos para mostrar.
    </div>

    <div v-else class="space-y-2.5 max-h-96 overflow-y-auto pr-2">
      <button
        v-for="row in rows"
        :key="row.subjectId"
        class="w-full text-left rounded-lg border border-[var(--color-border)] p-2.5 hover:border-[var(--color-primary)]/40 transition-colors"
        @click="openSubject(row.subjectId, row.riskLevel)"
      >
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="text-xs font-medium text-[var(--color-text)] truncate">{{ row.name }}</span>
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            :class="row.riskLevel === 'ok'
              ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
              : row.riskLevel === 'warning'
                ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'"
          >
            {{ row.riskLabel }}
          </span>
        </div>

        <div class="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden mb-1.5">
          <div class="h-full rounded-full bg-[var(--color-primary)]" :style="{ width: `${row.progressPct}%` }" />
        </div>

        <div class="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>{{ row.completedTopics }}/{{ row.totalTopics }} temas</span>
          <span>{{ row.studyHours.toFixed(1) }}h</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { useTopicStore } from '@/stores/topic'
import { studySessionCol } from '@/lib/collections'
import type { StudySession } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
const topicStore = useTopicStore()

const sessionsBySubject = ref<Record<string, StudySession[]>>({})

const activeSubjects = computed(() =>
  subjectStore.subjects.filter((subject) => subject.status !== 'convalidada')
)

const rows = computed(() => {
  return activeSubjects.value
    .map((subject) => {
      const topics = topicStore.getBySubject(subject.$id)
      const completedTopics = topics.filter((topic) => topic.status === 'completado').length
      const totalTopics = topics.length
      const topicPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
      const sessions = sessionsBySubject.value[subject.$id] ?? []
      const studyHours = sessions.reduce((sum, session) => sum + session.duration_minutes, 0) / 60
      const plannedHours = topics.reduce((sum, topic) => sum + (topic.estimated_hours ?? 0), 0)
      const hoursPct = plannedHours > 0 ? Math.min(100, Math.round((studyHours / plannedHours) * 100)) : topicPct
      const progressPct = Math.round(topicPct * 0.7 + hoursPct * 0.3)

      let riskLevel: 'ok' | 'warning' | 'risk' = 'ok'
      if (progressPct < 35) riskLevel = 'risk'
      else if (progressPct < 60) riskLevel = 'warning'

      return {
        subjectId: subject.$id,
        name: subject.name,
        completedTopics,
        totalTopics,
        studyHours,
        progressPct,
        riskLevel,
        riskLabel: riskLevel === 'ok' ? 'En ritmo' : riskLevel === 'warning' ? 'Ajustado' : 'Riesgo',
      }
    })
    .sort((a, b) => {
      const rank = { risk: 0, warning: 1, ok: 2 }
      const byRisk = rank[a.riskLevel] - rank[b.riskLevel]
      if (byRisk !== 0) return byRisk
      return a.progressPct - b.progressPct
    })
})

async function loadSessions() {
  const pairs = await Promise.all(
    activeSubjects.value.map(async (subject) => {
      const sessions = await studySessionCol.listBySubject(subject.$id)
      return [subject.$id, sessions] as const
    })
  )
  sessionsBySubject.value = Object.fromEntries(pairs)
}

function openSubject(subjectId: string, riskLevel: 'ok' | 'warning' | 'risk') {
  const status = riskLevel === 'ok' ? 'all' : 'open'
  router.push({
    name: 'subject-detail',
    params: { id: subjectId },
    query: { tab: 'topics', status },
  })
}

watch(activeSubjects, () => {
  loadSessions()
}, { immediate: true })
</script>
