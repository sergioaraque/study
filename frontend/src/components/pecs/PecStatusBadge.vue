<template>
  <BaseBadge :color="color">{{ label }}</BaseBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { PecStatus } from '@/types'

const props = defineProps<{ status: PecStatus }>()

const label = computed(() => ({ pendiente: 'Pendiente', en_progreso: 'En progreso', entregada: 'Entregada', calificada: 'Calificada' }[props.status]))
const color = computed(() => ({ pendiente: 'gray' as const, en_progreso: 'yellow' as const, entregada: 'blue' as const, calificada: 'green' as const }[props.status]))
</script>
