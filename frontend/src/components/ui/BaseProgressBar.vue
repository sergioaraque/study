<template>
  <div class="w-full">
    <div v-if="showLabel" class="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
      <span>{{ label }}</span>
      <span>{{ current }}/{{ total }}</span>
    </div>
    <div class="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="barColor"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  total: number
  label?: string
  showLabel?: boolean
}>()

const percentage = computed(() =>
  props.total > 0 ? Math.min(100, Math.round((props.current / props.total) * 100)) : 0
)

const barColor = computed(() => {
  if (percentage.value === 100) return 'bg-[var(--color-success)]'
  if (percentage.value >= 50) return 'bg-[var(--color-primary)]'
  return 'bg-[var(--color-warning)]'
})
</script>
