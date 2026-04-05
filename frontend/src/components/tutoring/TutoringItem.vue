<template>
  <div class="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group">
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="text-xs font-medium text-[var(--color-text-muted)]">{{ formattedDate }}</span>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="$emit('edit')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><Pencil :size="12" /></button>
        <button @click="$emit('delete')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 :size="12" /></button>
      </div>
    </div>
    <div v-if="periodicityLabel" class="mb-2 flex items-center gap-2">
      <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-medium">
        {{ periodicityLabel }}
      </span>
      <span v-if="session.recurrence_end_date" class="text-[10px] text-[var(--color-text-muted)]">
        hasta {{ recurrenceEndLabel }}
      </span>
    </div>
    <p v-if="session.notes" class="text-sm text-[var(--color-text)] whitespace-pre-line">{{ session.notes }}</p>
    <div v-if="tasks.length" class="mt-2 space-y-1">
      <p class="text-xs font-medium text-[var(--color-text-muted)]">Tareas de repaso:</p>
      <div v-for="(task, i) in tasks" :key="i" class="flex items-start gap-1.5 text-xs text-[var(--color-text)]">
        <span class="text-[var(--color-primary)] shrink-0">•</span>
        <span>{{ task }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TutoringSession } from '@/types'

const props = defineProps<{ session: TutoringSession }>()
defineEmits<{ edit: []; delete: [] }>()

const formattedDate = computed(() => format(new Date(props.session.date), "EEEE d 'de' MMMM yyyy", { locale: es }))
const tasks = computed(() => props.session.review_tasks ? (JSON.parse(props.session.review_tasks) as string[]) : [])
const periodicityLabel = computed(() => {
  if (props.session.periodicity === 'weekly') return 'Semanal'
  if (props.session.periodicity === 'biweekly') return 'Cada 2 semanas'
  return ''
})
const recurrenceEndLabel = computed(() => {
  if (!props.session.recurrence_end_date) return ''
  return format(new Date(props.session.recurrence_end_date), "d MMM yyyy", { locale: es })
})
</script>
