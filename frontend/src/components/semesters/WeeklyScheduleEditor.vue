<template>
  <div class="space-y-3">
    <div class="grid grid-cols-7 gap-2">
      <div v-for="day in days" :key="day.key" class="flex flex-col items-center gap-1">
        <span class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          {{ day.label }}
        </span>
        <input
          type="number"
          min="0"
          max="16"
          step="0.5"
          :value="modelValue[day.key]"
          @input="update(day.key, ($event.target as HTMLInputElement).value)"
          class="w-full text-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm py-2 px-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          :class="{ 'opacity-40': modelValue[day.key] === 0 }"
        />
        <div
          class="h-1 w-full rounded-full bg-[var(--color-border)] overflow-hidden"
          title="{{ modelValue[day.key] }}h"
        >
          <div
            class="h-full rounded-full transition-all"
            :class="day.weekend ? 'bg-[var(--color-text-muted)]' : 'bg-[var(--color-primary)]'"
            :style="{ width: `${Math.min((modelValue[day.key] / 8) * 100, 100)}%` }"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-1">
      <span class="text-xs text-[var(--color-text-muted)]">
        Entre semana: <strong class="text-[var(--color-text)]">{{ weekdayTotal }}h</strong>
      </span>
      <span class="text-xs text-[var(--color-text-muted)]">
        Total semana: <strong class="text-[var(--color-text)]">{{ weekTotal }}h</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklySchedule } from '@/types'

const props = defineProps<{ modelValue: WeeklySchedule }>()
const emit = defineEmits<{ 'update:modelValue': [value: WeeklySchedule] }>()

const days: { key: keyof WeeklySchedule; label: string; weekend: boolean }[] = [
  { key: 'hours_mon', label: 'Lun', weekend: false },
  { key: 'hours_tue', label: 'Mar', weekend: false },
  { key: 'hours_wed', label: 'Mié', weekend: false },
  { key: 'hours_thu', label: 'Jue', weekend: false },
  { key: 'hours_fri', label: 'Vie', weekend: false },
  { key: 'hours_sat', label: 'Sáb', weekend: true },
  { key: 'hours_sun', label: 'Dom', weekend: true },
]

function update(key: keyof WeeklySchedule, raw: string) {
  const val = Math.max(0, Math.min(16, parseFloat(raw) || 0))
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}

const weekdayTotal = computed(() =>
  ['hours_mon', 'hours_tue', 'hours_wed', 'hours_thu', 'hours_fri']
    .reduce((sum, k) => sum + (props.modelValue[k as keyof WeeklySchedule] ?? 0), 0)
)

const weekTotal = computed(() =>
  Object.values(props.modelValue).reduce((sum, v) => sum + (v ?? 0), 0)
)
</script>
