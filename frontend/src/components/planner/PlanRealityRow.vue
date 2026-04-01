<template>
  <div
    class="flex items-center gap-2 p-2 rounded-lg text-xs"
    :class="mode === 'planned'
      ? 'bg-[var(--color-surface-2)] border border-[var(--color-border)]'
      : 'bg-[var(--color-success)]/5 border border-[var(--color-success)]/20'"
  >
    <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="mode === 'completed' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'" />
    <div class="flex-1 min-w-0">
      <p class="text-[var(--color-text)] truncate">T{{ topic.number }} {{ topic.title }}</p>
      <p class="text-[var(--color-text-muted)] truncate">{{ subjectName }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '@/types'
defineProps<{ topic: Topic; subjectName: string; mode: 'planned' | 'completed' }>()
</script>
