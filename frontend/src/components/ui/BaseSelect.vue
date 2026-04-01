<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number
  label?: string
  options: { value: string | number; label: string }[]
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
