<template>
  <div class="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <PecStatusBadge :status="pec.status" />
          <span class="text-sm font-medium text-[var(--color-text)] truncate">{{ pec.title }}</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span v-if="pec.due_date" :class="urgencyClass">
            {{ daysLeftLabel }}
          </span>
          <span v-else class="italic">Sin fecha de entrega</span>
          <span v-if="pec.grade !== undefined" class="font-medium text-[var(--color-text)]">
            Nota: {{ pec.grade }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button @click="$emit('edit')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <Pencil :size="12" />
        </button>
        <button @click="$emit('delete')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
          <Trash2 :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { differenceInCalendarDays } from 'date-fns'
import PecStatusBadge from './PecStatusBadge.vue'
import type { Pec, PecStatus } from '@/types'

const props = defineProps<{ pec: Pec }>()
defineEmits<{ edit: []; delete: []; 'update-status': [status: PecStatus] }>()

const daysLeft = computed(() => {
  if (!props.pec.due_date) return null
  return differenceInCalendarDays(new Date(props.pec.due_date), new Date())
})

const daysLeftLabel = computed(() => {
  const d = daysLeft.value
  if (d === null) return ''
  if (d < 0) return `Vencida hace ${Math.abs(d)} días`
  if (d === 0) return '¡Entrega hoy!'
  return `${d} día${d !== 1 ? 's' : ''} restantes`
})

const urgencyClass = computed(() => {
  const d = daysLeft.value
  if (d === null) return ''
  if (d <= 3) return 'text-[var(--color-danger)] font-medium'
  if (d <= 7) return 'text-[var(--color-warning)]'
  return ''
})
</script>
