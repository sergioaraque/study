<template>
  <div
    class="flex-1 min-w-28 flex flex-col"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- Day header (clickable) -->
    <div
      class="relative text-center py-2 rounded-t-lg border border-b-0 cursor-pointer transition-colors hover:bg-[var(--color-surface-raised)]"
      :class="isToday
        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30'
        : 'bg-[var(--color-surface)] border-[var(--color-border)]'"
      @click="$emit('click-day')"
    >
      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{{ dayName }}</p>
      <p class="text-sm font-semibold" :class="isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'">
        {{ dayNumber }}
      </p>
      <p v-if="availableHours > 0" class="text-xs mt-0.5" :class="overloaded ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'">
        {{ plannedHours }}h/{{ availableHours }}h
      </p>
      <!-- Overdue badge (Option B) -->
      <span
        v-if="overdueCount > 0"
        class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--color-warning)] text-white"
      >{{ overdueCount }}</span>
    </div>

    <!-- Drop zone -->
    <div
      class="flex-1 min-h-32 p-2 rounded-b-lg border border-t-0 space-y-1.5"
      :class="isDragOver
        ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30'
        : 'bg-[var(--color-surface)] border-[var(--color-border)]'"
      @dragenter="isDragOver = true"
      @dragleave="isDragOver = false"
    >
      <TopicDraggable
        v-for="topic in topics"
        :key="topic.$id"
        :topic="topic"
        :subject="subjects[topic.subject_id]"
        @remove="$emit('remove', topic.$id, topic.subject_id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, isToday as dateFnsIsToday, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import TopicDraggable from './TopicDraggable.vue'
import type { Topic, Subject } from '@/types'

const props = defineProps<{
  day: Date
  topics: Topic[]
  subjects: Record<string, Subject>
  availableHours?: number
}>()

const emit = defineEmits<{
  drop: [topicId: string, subjectId: string]
  remove: [topicId: string, subjectId: string]
  'click-day': []
}>()

const isDragOver = ref(false)
const isToday = computed(() => dateFnsIsToday(props.day))
const dayName = computed(() => format(props.day, 'EEE', { locale: es }))
const dayNumber = computed(() => format(props.day, 'd'))

const isPast = computed(() => isBefore(props.day, startOfDay(new Date())))

const plannedHours = computed(() =>
  props.topics.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
)
const overloaded = computed(() =>
  (props.availableHours ?? 0) > 0 && plannedHours.value > (props.availableHours ?? 0)
)

// Option B: count topics from past days that aren't completed
const overdueCount = computed(() =>
  isPast.value ? props.topics.filter((t) => t.status !== 'completado').length : 0
)

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const data = e.dataTransfer?.getData('application/json')
  if (!data) return
  const { topicId, subjectId } = JSON.parse(data) as { topicId: string; subjectId: string }
  emit('drop', topicId, subjectId)
}
</script>
