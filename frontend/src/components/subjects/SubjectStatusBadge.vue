<template>
  <BaseBadge :color="badgeColor">{{ label }}</BaseBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { SubjectStatus } from '@/types'

const props = defineProps<{ status: SubjectStatus }>()

const label = computed(() => ({
  activa: 'Activa',
  convalidada: 'Convalidada',
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
}[props.status]))

const badgeColor = computed(() => ({
  activa: 'indigo' as const,
  convalidada: 'purple' as const,
  aprobada: 'green' as const,
  pendiente: 'gray' as const,
}[props.status]))
</script>
