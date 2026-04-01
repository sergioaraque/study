<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    :class="colorClass"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray' | 'indigo'
}>()

const colorClass = computed(() => ({
  'bg-green-500/15 text-green-400': props.color === 'green',
  'bg-yellow-500/15 text-yellow-400': props.color === 'yellow',
  'bg-red-500/15 text-red-400': props.color === 'red',
  'bg-blue-500/15 text-blue-400': props.color === 'blue',
  'bg-purple-500/15 text-purple-400': props.color === 'purple',
  'bg-gray-500/15 text-gray-400': props.color === 'gray',
  'bg-indigo-500/15 text-indigo-400': props.color === 'indigo' || !props.color,
}))
</script>
