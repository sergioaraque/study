<template>
  <div
    v-if="alert"
    class="rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <div class="mt-0.5 shrink-0 rounded-full bg-[var(--color-warning)]/20 p-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[var(--color-warning)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[var(--color-text)]">Ritmo de estudio por debajo del semestre</p>
        <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
          Vas al <span class="font-semibold text-[var(--color-text)]">{{ alert.topicPct }}%</span> de los temas
          pero el semestre está al <span class="font-semibold text-[var(--color-text)]">{{ alert.semesterPct }}%</span>
          — llevas <span class="font-semibold text-[var(--color-warning)]">{{ alert.diff }} puntos de retraso</span>.
        </p>
      </div>
    </div>

    <!-- Dual progress bars -->
    <div class="mt-4 space-y-2">
      <!-- Semester progress -->
      <div>
        <div class="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Semestre transcurrido</span>
          <span class="font-medium text-[var(--color-text)]">{{ alert.semesterPct }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            class="h-full rounded-full bg-[var(--color-warning)]/70 transition-all"
            :style="{ width: `${alert.semesterPct}%` }"
          />
        </div>
      </div>

      <!-- Topics progress -->
      <div>
        <div class="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Temas completados</span>
          <span class="font-medium text-[var(--color-text)]">{{ alert.topicPct }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            class="h-full rounded-full bg-[var(--color-primary)] transition-all"
            :style="{ width: `${alert.topicPct}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Action suggestion -->
    <p class="mt-3 text-xs text-[var(--color-text-muted)]">
      Para terminar a tiempo necesitas completar aproximadamente
      <span class="font-semibold text-[var(--color-text)]">~{{ alert.topicsPerWeek }} tema{{ alert.topicsPerWeek !== 1 ? 's' : '' }}/semana</span>
      durante las próximas
      <span class="font-semibold text-[var(--color-text)]">{{ alert.weeksLeft }} semana{{ alert.weeksLeft !== 1 ? 's' : '' }}</span>
      ({{ alert.topicsLeft }} temas pendientes).
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns'
import { useSemesterStore } from '@/stores/semester'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'

const semesterStore = useSemesterStore()
const topicStore = useTopicStore()
const subjectStore = useSubjectStore()

const alert = computed(() => {
  const s = semesterStore.activeSemester
  if (!s?.start_date || !s?.end_date) return null

  const now = new Date()
  const start = parseISO(s.start_date)
  const end = parseISO(s.end_date)

  if (isBefore(now, start) || isAfter(now, end)) return null

  const totalDays = differenceInDays(end, start)
  const elapsedDays = differenceInDays(now, start)
  const semesterPct = Math.round((elapsedDays / totalDays) * 100)

  const allTopics = subjectStore.subjects.flatMap(sub => topicStore.getBySubject(sub.$id))
  const totalTopics = allTopics.length
  if (totalTopics === 0) return null

  const completedTopics = allTopics.filter(t => t.status === 'completado').length
  const topicPct = Math.round((completedTopics / totalTopics) * 100)

  const diff = semesterPct - topicPct
  if (diff < 10) return null // on track

  const weeksLeft = Math.ceil(differenceInDays(end, now) / 7)
  const topicsLeft = totalTopics - completedTopics
  const topicsPerWeek = weeksLeft > 0 ? Math.ceil(topicsLeft / weeksLeft) : topicsLeft

  return { semesterPct, topicPct, diff, topicsLeft, topicsPerWeek, weeksLeft }
})
</script>
