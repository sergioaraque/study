<template>
  <div
    class="flex-1 flex flex-col"
    :class="compact ? 'min-w-24' : 'min-w-28'"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- Day header (clickable) -->
    <div
      class="relative text-center rounded-t-lg border border-b-0 cursor-pointer transition-colors hover:bg-[var(--color-surface-raised)]"
      :class="[
        compact ? 'py-1.5 px-1.5' : 'py-2 px-2',
        isToday
          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]',
      ]"
      @click="$emit('click-day')"
    >
      <p class="uppercase tracking-wide" :class="compact ? 'text-[10px] text-[var(--color-text-muted)]' : 'text-xs text-[var(--color-text-muted)]'">{{ dayName }}</p>
      <p :class="[compact ? 'text-xs font-semibold' : 'text-sm font-semibold', isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]']">
        {{ dayNumber }}
      </p>
      <p v-if="(availableHours ?? 0) > 0" class="mt-0.5" :class="[compact ? 'text-[10px]' : 'text-xs', loadStateClass]">
        {{ plannedHours.toFixed(1) }}h/{{ availableHours!.toFixed(1) }}h · {{ loadStateLabel }}
      </p>
      <div v-if="(availableHours ?? 0) > 0" :class="compact ? 'mx-1 mt-1 h-1 rounded-full' : 'mx-2 mt-1.5 h-1.5 rounded-full'" class="bg-[var(--color-border)] overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="loadBarClass"
          :style="{ width: `${Math.min(loadRatio * 100, 100)}%` }"
        />
      </div>
      <!-- Overdue badge (Option B) -->
      <span
        v-if="overdueCount > 0"
        class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--color-warning)] text-white"
      >{{ overdueCount }}</span>
    </div>

    <!-- Drop zone -->
    <div
      class="flex-1 rounded-b-lg border border-t-0"
      :class="[
        compact ? 'min-h-28 p-1.5 space-y-1' : 'min-h-32 p-2 space-y-1.5',
        isDragOver
          ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]',
      ]"
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

      <div
        v-for="session in tutorings"
        :key="session.$id"
        class="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
        :class="compact ? 'px-1.5 py-1' : 'px-2 py-1.5'"
      >
        <p :class="compact ? 'text-[9px]' : 'text-[10px]'" class="font-semibold text-[var(--color-text)] leading-tight">Tutoría</p>
        <p :class="compact ? 'text-[9px]' : 'text-[10px]'" class="text-[var(--color-text-muted)] leading-tight">{{ subjectName(session.subject_id) }} · {{ formatTime(session.date) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, isToday as dateFnsIsToday, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import TopicDraggable from './TopicDraggable.vue'
import type { Topic, Subject, TutoringSession } from '@/types'

const props = defineProps<{
  day: Date
  topics: Topic[]
  tutorings: TutoringSession[]
  subjects: Record<string, Subject>
  availableHours?: number
  compact?: boolean
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
const loadRatio = computed(() => {
  const avail = props.availableHours ?? 0
  if (avail <= 0) return 0
  return plannedHours.value / avail
})
const loadStateLabel = computed(() => {
  if ((props.availableHours ?? 0) <= 0) return 'Sin horario'
  if (loadRatio.value > 1) return 'Sobrecargado'
  if (loadRatio.value >= 0.85) return 'Ajustado'
  return 'Libre'
})
const loadStateClass = computed(() => {
  if (loadRatio.value > 1) return 'text-[var(--color-error)]'
  if (loadRatio.value >= 0.85) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-text-muted)]'
})
const loadBarClass = computed(() => {
  if (loadRatio.value > 1) return 'bg-[var(--color-error)]'
  if (loadRatio.value >= 0.85) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-success)]'
})

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

function subjectName(subjectId: string): string {
  return props.subjects[subjectId]?.name ?? 'Asignatura'
}

function formatTime(value: string): string {
  return format(new Date(value), 'HH:mm')
}
</script>
