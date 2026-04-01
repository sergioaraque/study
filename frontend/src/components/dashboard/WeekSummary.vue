<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Esta semana</h3>
      <RouterLink to="/planner" class="text-xs text-[var(--color-primary)] hover:underline">Ver planificador</RouterLink>
    </div>

    <!-- Horas disponibles vs planificadas -->
    <div v-if="weekTotalAvailable > 0" class="mb-3 p-2.5 rounded-lg bg-[var(--color-surface-raised)]">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs text-[var(--color-text-muted)]">Horas disponibles esta semana</span>
        <span class="text-xs font-semibold text-[var(--color-text)]">
          {{ plannedHours }}h / {{ weekTotalAvailable }}h
        </span>
      </div>
      <div class="h-1.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="overPlanned ? 'bg-[var(--color-error)]' : 'bg-[var(--color-primary)]'"
          :style="{ width: `${Math.min((plannedHours / weekTotalAvailable) * 100, 100)}%` }"
        />
      </div>
      <p v-if="overPlanned" class="text-xs text-[var(--color-error)] mt-1">
        {{ plannedHours - weekTotalAvailable }}h por encima de tu disponibilidad
      </p>
      <p v-else class="text-xs text-[var(--color-text-muted)] mt-1">
        {{ (weekTotalAvailable - plannedHours).toFixed(1) }}h libres
      </p>
    </div>

    <div v-if="!weekTopics.length" class="text-xs text-[var(--color-text-muted)] italic">
      Nada planificado esta semana.<br>
      <RouterLink to="/planner" class="text-[var(--color-primary)] hover:underline">Asigna temas al planificador.</RouterLink>
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="topic in weekTopics"
        :key="topic.$id"
        class="flex items-center gap-2 text-xs"
      >
        <div
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="{
            'bg-[var(--color-success)]': topic.status === 'completado',
            'bg-[var(--color-warning)]': topic.status === 'en_progreso',
            'bg-[var(--color-border)]': topic.status === 'pendiente',
          }"
        />
        <span class="text-[var(--color-text)] truncate" :class="{ 'opacity-50 line-through': topic.status === 'completado' }">
          T{{ topic.number }} {{ topic.title }}
        </span>
        <span v-if="topic.estimated_hours" class="ml-auto text-[var(--color-text-muted)] shrink-0">
          {{ topic.estimated_hours }}h
        </span>
      </div>
      <p class="text-xs text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]">
        {{ completedCount }}/{{ weekTopics.length }} completados esta semana
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { useSemesterStore } from '@/stores/semester'

const planner = usePlannerStore()
const semesterStore = useSemesterStore()

const weekTopics = computed(() => planner.weekTopics)
const completedCount = computed(() => weekTopics.value.filter((t) => t.status === 'completado').length)

const plannedHours = computed(() =>
  weekTopics.value.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
)

const weekTotalAvailable = computed(() => {
  const sch = semesterStore.activeSchedule
  return Object.values(sch).reduce((sum, v) => sum + v, 0)
})

const overPlanned = computed(() => weekTotalAvailable.value > 0 && plannedHours.value > weekTotalAvailable.value)
</script>
