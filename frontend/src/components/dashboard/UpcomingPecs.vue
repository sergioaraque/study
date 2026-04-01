<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3">Próximas PECs</h3>

    <div v-if="!pecStore.upcomingPecs.length" class="text-xs text-[var(--color-text-muted)] italic">
      No hay PECs pendientes
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="pec in pecStore.upcomingPecs.slice(0, 5)"
        :key="pec.$id"
        class="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] last:border-0"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm text-[var(--color-text)] truncate">{{ pec.title }}</p>
        </div>
        <span v-if="pec.due_date" class="text-xs shrink-0 font-medium" :class="urgencyClass(pec.due_date)">
          {{ daysLeftLabel(pec.due_date) }}
        </span>
        <span v-else class="text-xs text-[var(--color-text-muted)] shrink-0 italic">Sin fecha</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { differenceInCalendarDays } from 'date-fns'
import { usePecStore } from '@/stores/pec'

const pecStore = usePecStore()

function daysLeft(dateStr: string) {
  return differenceInCalendarDays(new Date(dateStr), new Date())
}

function daysLeftLabel(dateStr: string) {
  const d = daysLeft(dateStr)
  if (d < 0) return `Vencida`
  if (d === 0) return '¡Hoy!'
  return `${d}d`
}

function urgencyClass(dateStr: string) {
  const d = daysLeft(dateStr)
  if (d <= 3) return 'text-[var(--color-danger)]'
  if (d <= 7) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-text-muted)]'
}
</script>
