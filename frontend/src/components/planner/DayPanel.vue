<template>
  <BaseSidepanel :open="open" @close="$emit('close')" :title="panelTitle">
    <!-- Past day with pending topics alert -->
    <div
      v-if="isPast && pendingTopics.length"
      class="mb-4 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-start gap-2"
    >
      <AlertCircle :size="14" class="text-[var(--color-warning)] mt-0.5 shrink-0" />
      <div class="flex-1">
        <p class="text-xs font-medium text-[var(--color-text)] mb-1.5">
          {{ pendingTopics.length }} tema{{ pendingTopics.length !== 1 ? 's' : '' }} sin completar
        </p>
        <button @click="movePendingToToday" class="btn-primary text-xs">
          Mover todos a hoy
        </button>
      </div>
    </div>

    <!-- Topics -->
    <div v-if="topics.length" class="space-y-4">
      <div
        v-for="topic in topics"
        :key="topic.$id"
        class="border border-[var(--color-border)] rounded-xl overflow-hidden"
      >
        <!-- Topic header -->
        <div class="p-3 bg-[var(--color-surface-raised)] flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-[var(--color-text)] truncate">
              T{{ topic.number }}. {{ topic.title }}
            </p>
            <p v-if="subjects[topic.subject_id]" class="text-xs text-[var(--color-text-muted)] truncate">
              {{ subjects[topic.subject_id].name }}
            </p>
          </div>
          <span
            class="text-xs px-2 py-0.5 rounded-full shrink-0 capitalize"
            :class="statusClass(topic.status)"
          >{{ topic.status }}</span>
        </div>
        <!-- Task list -->
        <div class="px-3 pb-3">
          <TopicTaskList :topic-id="topic.$id" :user-id="topic.user_id" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-sm text-[var(--color-text-muted)]">
      No hay temas asignados a este día.
    </div>
  </BaseSidepanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertCircle } from 'lucide-vue-next'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import TopicTaskList from '@/components/topics/TopicTaskList.vue'
import type { Topic, Subject } from '@/types'

const props = defineProps<{
  open: boolean
  day: Date | null
  topics: Topic[]
  subjects: Record<string, Subject>
}>()

const emit = defineEmits<{
  close: []
  'move-to-today': [topicId: string, subjectId: string]
}>()

const panelTitle = computed(() =>
  props.day ? format(props.day, "EEEE d 'de' MMMM", { locale: es }) : ''
)

const isPast = computed(() =>
  props.day ? isBefore(props.day, startOfDay(new Date())) : false
)

const pendingTopics = computed(() =>
  props.topics.filter((t) => t.status !== 'completado')
)

function statusClass(status: string) {
  if (status === 'completado') return 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
  if (status === 'en progreso') return 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
  return 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
}

function movePendingToToday() {
  for (const topic of pendingTopics.value) {
    emit('move-to-today', topic.$id, topic.subject_id)
  }
}
</script>
