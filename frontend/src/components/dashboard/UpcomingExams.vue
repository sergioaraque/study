<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3">Próximos exámenes</h3>

    <div v-if="!examStore.upcomingExams.length" class="text-xs text-[var(--color-text-muted)] italic">
      No hay exámenes próximos
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="exam in upcomingExamsWithDates"
        :key="exam.$id"
        class="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] last:border-0"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm text-[var(--color-text)] truncate">{{ subjectName(exam.subject_id) }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">Conv. {{ exam.chosen_convocatoria ?? 1 }}</p>
        </div>
        <span class="text-xs shrink-0 font-medium" :class="urgencyClass(exam.chosenDate)">
          {{ daysLeftLabel(exam.chosenDate) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { differenceInCalendarDays } from 'date-fns'
import { useExamStore } from '@/stores/exam'
import { useSubjectStore } from '@/stores/subject'

const examStore = useExamStore()
const subjectStore = useSubjectStore()

const upcomingExamsWithDates = computed(() =>
  examStore.upcomingExams
    .map((e) => ({
      ...e,
      chosenDate: examStore.getChosenDate(e) ?? '',
    }))
    .filter((e) => e.chosenDate)
    .slice(0, 5)
)

function subjectName(subjectId: string) {
  return subjectStore.getById(subjectId)?.name ?? ''
}

function daysLeft(dateStr: string) {
  return differenceInCalendarDays(new Date(dateStr), new Date())
}

function daysLeftLabel(dateStr: string) {
  if (!dateStr) return '—'
  const d = daysLeft(dateStr)
  if (d < 0) return 'Pasado'
  if (d === 0) return '¡Hoy!'
  return `${d}d`
}

function urgencyClass(dateStr: string) {
  if (!dateStr) return 'text-[var(--color-text-muted)]'
  const d = daysLeft(dateStr)
  if (d <= 7) return 'text-[var(--color-danger)]'
  if (d <= 14) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-text-muted)]'
}
</script>
