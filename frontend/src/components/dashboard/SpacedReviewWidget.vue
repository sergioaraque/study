<template>
  <div
    v-if="dueReviews.length"
    class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Repasos pendientes</h3>
      <span class="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
        {{ dueReviews.length }}
      </span>
    </div>

    <!-- List -->
    <div class="space-y-2">
      <div
        v-for="item in dueReviews.slice(0, 5)"
        :key="item.topic.$id"
        class="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised,var(--color-surface))] px-3 py-2"
      >
        <!-- Topic info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-[var(--color-text)] truncate">
            T{{ item.topic.number }} {{ item.topic.title }}
          </p>
          <p class="text-xs text-[var(--color-text-muted)] truncate">{{ item.subjectName }}</p>
        </div>

        <!-- Review type badge -->
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="badgeClass(item.reviewType)"
        >
          {{ item.reviewType }} días
        </span>

        <!-- Repasar button -->
        <button
          type="button"
          class="shrink-0 rounded-md bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20 active:scale-95"
          @click="emit('review', item.topic.$id)"
        >
          Repasar
        </button>
      </div>
    </div>

    <!-- Overflow hint -->
    <p
      v-if="dueReviews.length > 5"
      class="mt-2 text-center text-xs text-[var(--color-text-muted)]"
    >
      +{{ dueReviews.length - 5 }} más pendientes
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { differenceInDays, parseISO } from 'date-fns'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'

const emit = defineEmits<{ review: [topicId: string] }>()

const topicStore = useTopicStore()
const subjectStore = useSubjectStore()

const REVIEW_DAYS = [3, 7, 21] as const

interface ReviewItem {
  topic: ReturnType<typeof topicStore.getBySubject>[number]
  subjectName: string
  daysSince: number
  reviewType: 3 | 7 | 21
}

const dueReviews = computed<ReviewItem[]>(() => {
  const today = new Date()

  return subjectStore.subjects.flatMap(sub =>
    topicStore.getBySubject(sub.$id)
      .filter(t => t.status === 'completado')
      .flatMap(t => {
        // Use $updatedAt as best proxy for completion datetime
        const completedDate = parseISO(t.$updatedAt)
        const daysSince = differenceInDays(today, completedDate)
        const nextReview = REVIEW_DAYS.find(d => daysSince >= d && daysSince < d + 3)
        if (!nextReview) return []
        const subject = subjectStore.getById(t.subject_id)
        return [{
          topic: t,
          subjectName: subject?.name ?? '',
          daysSince,
          reviewType: nextReview,
        }]
      })
  )
})

function badgeClass(reviewType: 3 | 7 | 21): string {
  if (reviewType === 3) return 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
  if (reviewType === 7) return 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
  return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
}
</script>
