<template>
  <div
    draggable="true"
    @dragstart="onDragStart"
    class="p-2 rounded-lg border cursor-grab active:cursor-grabbing group text-xs"
    :class="statusClass"
  >
    <div class="flex items-start justify-between gap-1">
      <div class="flex-1 min-w-0">
        <p class="font-medium text-[var(--color-text)] truncate">T{{ topic.number }} {{ topic.title }}</p>
        <p v-if="subject" class="text-[var(--color-text-muted)] truncate mt-0.5">{{ subject.name }}</p>
      </div>
      <button
        @click.stop="$emit('remove')"
        class="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-danger)] shrink-0"
      >
        <X :size="10" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { Topic, Subject } from '@/types'

const props = defineProps<{ topic: Topic; subject: Subject | undefined }>()
defineEmits<{ remove: [] }>()

const statusClass = computed(() => ({
  'border-[var(--color-border)] bg-[var(--color-surface-2)]': props.topic.status === 'pendiente',
  'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5': props.topic.status === 'en_progreso',
  'border-[var(--color-success)]/40 bg-[var(--color-success)]/5 opacity-60': props.topic.status === 'completado',
}))

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('application/json', JSON.stringify({
    topicId: props.topic.$id,
    subjectId: props.topic.subject_id,
  }))
}
</script>
