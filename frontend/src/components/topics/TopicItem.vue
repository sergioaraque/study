<template>
  <div class="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors group">
    <!-- Header row -->
    <div class="flex items-center gap-3 p-3">
      <!-- Status toggle -->
      <button
        @click.stop="cycleStatus"
        class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        :class="statusButtonClass"
        :title="statusLabel"
      >
        <Check v-if="topic.status === 'completado'" :size="10" />
        <Minus v-else-if="topic.status === 'en_progreso'" :size="10" />
      </button>

      <!-- Content -->
      <div class="flex-1 min-w-0 cursor-pointer" @click="open = !open">
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--color-text-muted)] shrink-0">T{{ topic.number }}</span>
          <span class="text-sm text-[var(--color-text)] truncate" :class="{ 'line-through opacity-50': topic.status === 'completado' }">
            {{ topic.title }}
          </span>
          <!-- Task progress pill -->
          <span
            v-if="taskProgress !== null"
            class="text-xs px-1.5 py-0.5 rounded-full shrink-0 transition-colors"
            :class="taskProgress === 100
              ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
              : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'"
          >
            {{ taskDone }}/{{ taskTotal }}
          </span>
        </div>
        <div v-if="topic.real_hours || topic.estimated_hours" class="text-xs text-[var(--color-text-muted)] mt-0.5">
          {{ topic.real_hours ? `${topic.real_hours}h reales` : '' }}
          {{ topic.estimated_hours ? ` / ${topic.estimated_hours}h estimadas` : '' }}
        </div>
      </div>

      <!-- Expand arrow -->
      <button @click="open = !open" class="shrink-0 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
        <ChevronDown :size="14" :class="open ? 'rotate-180' : ''" class="transition-transform" />
      </button>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button @click.stop="$emit('edit')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <Pencil :size="12" />
        </button>
        <button @click.stop="$emit('delete')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
          <Trash2 :size="12" />
        </button>
      </div>
    </div>

    <!-- Expandable tasks -->
    <div v-if="open" class="px-3 pb-3 border-t border-[var(--color-border)]/50">
      <TopicTaskList :topic-id="topic.$id" :user-id="topic.user_id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronDown, Minus, Pencil, Trash2 } from 'lucide-vue-next'
import { useTopicTaskStore } from '@/stores/topic-task'
import type { Topic, TopicStatus } from '@/types'
import TopicTaskList from './TopicTaskList.vue'

const props = defineProps<{ topic: Topic }>()
const emit = defineEmits<{
  'status-change': [status: TopicStatus]
  edit: []
  delete: []
}>()

const open = ref(false)
const taskStore = useTopicTaskStore()

const taskTotal = computed(() => taskStore.getByTopic(props.topic.$id).length)
const taskDone = computed(() => taskStore.getByTopic(props.topic.$id).filter((t) => t.done).length)
const taskProgress = computed(() => taskTotal.value > 0 ? Math.round((taskDone.value / taskTotal.value) * 100) : null)

const statusCycle: TopicStatus[] = ['pendiente', 'en_progreso', 'completado']

const statusLabel = computed(() => ({
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completado: 'Completado',
}[props.topic.status]))

const statusButtonClass = computed(() => ({
  'border-[var(--color-border)] text-transparent': props.topic.status === 'pendiente',
  'border-[var(--color-warning)] text-[var(--color-warning)]': props.topic.status === 'en_progreso',
  'border-[var(--color-success)] bg-[var(--color-success)] text-white': props.topic.status === 'completado',
}))

function cycleStatus() {
  const idx = statusCycle.indexOf(props.topic.status)
  const next = statusCycle[(idx + 1) % statusCycle.length]
  emit('status-change', next)
}
</script>
