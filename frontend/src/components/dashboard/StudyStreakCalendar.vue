<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Racha de estudio</h3>
      <div class="flex items-center gap-1.5">
        <Flame :size="16" class="text-orange-400" />
        <span class="text-sm font-bold text-[var(--color-text)]">{{ streak }} día{{ streak !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Activity grid — 52 cols × 7 rows -->
    <div class="overflow-x-auto">
      <div class="grid gap-0.5" style="grid-template-columns: repeat(53, 1fr); grid-template-rows: repeat(7, 10px)">
        <div
          v-for="cell in calendarGrid"
          :key="cell.date"
          class="rounded-sm transition-colors"
          :class="cell.active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
          :title="cell.date"
        />
      </div>
    </div>

    <div class="flex items-center justify-end gap-1.5 mt-2 text-xs text-[var(--color-text-muted)]">
      <span>Menos</span>
      <div class="w-2.5 h-2.5 rounded-sm bg-[var(--color-border)]" />
      <div class="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]/40" />
      <div class="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]" />
      <span>Más</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flame } from 'lucide-vue-next'
import { useStreak } from '@/composables/useStreak'

const { streak, calendarGrid } = useStreak()
</script>
