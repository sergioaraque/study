<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="variantClass"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
})

const variantClass = computed(() => ({
  'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white': props.variant === 'primary',
  'bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]': props.variant === 'secondary',
  'hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]': props.variant === 'ghost',
  'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20': props.variant === 'danger',
}))
</script>
