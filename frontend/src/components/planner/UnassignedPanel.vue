<template>
  <div class="w-48 shrink-0 flex flex-col gap-2">
    <!-- Overdue topics (Option D) -->
    <div
      v-if="overdue.length"
      class="bg-[var(--color-surface)] border border-[var(--color-warning)]/40 rounded-lg p-3"
    >
      <h3 class="text-xs font-semibold text-[var(--color-warning)] uppercase tracking-wide mb-2 flex items-center gap-1">
        <AlertCircle :size="11" />
        Atrasados
      </h3>
      <div class="space-y-1.5 max-h-64 overflow-y-auto">
        <div
          v-for="topic in overdue"
          :key="topic.$id"
          class="p-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 text-xs"
        >
          <p class="font-medium text-[var(--color-text)] truncate">T{{ topic.number }} {{ topic.title }}</p>
          <p class="text-[var(--color-text-muted)] truncate mt-0.5">{{ subjectName(topic.subject_id) }}</p>
          <button
            @click="$emit('move-to-today', topic.$id, topic.subject_id)"
            class="mt-1.5 text-[10px] text-[var(--color-warning)] hover:underline font-medium"
          >
            Mover a hoy →
          </button>
        </div>
      </div>
    </div>

    <!-- Unassigned topics -->
    <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
      <h3 class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Sin asignar</h3>

      <div
        v-if="unassignedTopics.length === 0"
        class="text-xs text-[var(--color-text-muted)] italic py-2"
      >
        Todos los temas asignados
      </div>

      <div v-else class="space-y-1.5 max-h-96 overflow-y-auto">
        <div
          v-for="topic in unassignedTopics"
          :key="topic.$id"
          draggable="true"
          @dragstart="onDragStart($event, topic)"
          class="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] cursor-grab text-xs hover:border-[var(--color-primary)]/40 transition-colors"
        >
          <p class="font-medium text-[var(--color-text)] truncate">T{{ topic.number }} {{ topic.title }}</p>
          <p class="text-[var(--color-text-muted)] truncate mt-0.5">{{ subjectName(topic.subject_id) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import { useSubjectStore } from '@/stores/subject'
import { usePlannerStore } from '@/stores/planner'
import type { Topic } from '@/types'

const props = defineProps<{ subjectIds: string[]; compact?: boolean }>()
defineEmits<{ assign: []; 'move-to-today': [topicId: string, subjectId: string] }>()

const topicStore = useTopicStore()
const subjectStore = useSubjectStore()
const plannerStore = usePlannerStore()

const overdue = computed(() => plannerStore.overdueTopics)

const unassignedTopics = computed(() =>
  props.subjectIds.flatMap((id) =>
    topicStore.getBySubject(id).filter((t) => !t.planner_day && t.status !== 'completado')
  )
)

function subjectName(subjectId: string) {
  return subjectStore.getById(subjectId)?.name ?? ''
}

function onDragStart(e: DragEvent, topic: Topic) {
  e.dataTransfer?.setData('application/json', JSON.stringify({
    topicId: topic.$id,
    subjectId: topic.subject_id,
  }))
}
</script>
