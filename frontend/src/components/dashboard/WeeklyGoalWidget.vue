<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Objetivo semanal</h3>
      <span class="text-xs text-[var(--color-text-muted)]">{{ weekRangeLabel }}</span>
    </div>

    <!-- No goal configured -->
    <div v-if="!goal" class="text-center py-3">
      <Target :size="28" class="mx-auto mb-2 text-[var(--color-border)]" />
      <p class="text-xs text-[var(--color-text-muted)] mb-2">Sin objetivo configurado</p>
      <p class="text-xs text-[var(--color-text-muted)]">
        Defínelo en
        <button @click="$emit('open-settings')" class="text-[var(--color-primary)] hover:underline">
          Semestres → editar
        </button>
      </p>
    </div>

    <!-- Goal configured -->
    <template v-else>
      <div class="flex items-end justify-between mb-2">
        <div>
          <span class="text-2xl font-bold" :class="colorClass">{{ studiedHours.toFixed(1) }}h</span>
          <span class="text-sm text-[var(--color-text-muted)] ml-1">de {{ goal }}h</span>
        </div>
        <span class="text-xs font-medium" :class="colorClass">{{ pct }}%</span>
      </div>

      <div class="h-2 w-full rounded-full bg-[var(--color-border)] overflow-hidden mb-2">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="barColor"
          :style="{ width: `${Math.min(pct, 100)}%` }"
        />
      </div>

      <p class="text-xs text-[var(--color-text-muted)]">
        <template v-if="loading">Cargando sesiones…</template>
        <template v-else-if="pct >= 100">¡Objetivo alcanzado! 🎉</template>
        <template v-else-if="remaining > 0">{{ remaining.toFixed(1) }}h restantes</template>
        <template v-else>Sin sesiones registradas esta semana</template>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Target } from 'lucide-vue-next'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { studySessionCol } from '@/lib/collections'
import { useSemesterStore } from '@/stores/semester'
import { useAuthStore } from '@/stores/auth'

defineEmits<{ 'open-settings': [] }>()

const semesterStore = useSemesterStore()
const auth = useAuthStore()

const loading = ref(false)
const studiedMinutes = ref(0)

const goal = computed(() => semesterStore.activeSemester?.weekly_hours_goal ?? 0)
const studiedHours = computed(() => studiedMinutes.value / 60)
const pct = computed(() => goal.value > 0 ? Math.round((studiedHours.value / goal.value) * 100) : 0)
const remaining = computed(() => Math.max(0, goal.value - studiedHours.value))

const colorClass = computed(() => {
  if (pct.value >= 100) return 'text-[var(--color-success)]'
  if (pct.value >= 60) return 'text-[var(--color-primary)]'
  return 'text-[var(--color-text)]'
})

const barColor = computed(() => {
  if (pct.value >= 100) return 'bg-[var(--color-success)]'
  if (pct.value >= 60) return 'bg-[var(--color-primary)]'
  if (pct.value >= 30) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-error)]'
})

const weekRangeLabel = computed(() => {
  const now = new Date()
  const mon = startOfWeek(now, { weekStartsOn: 1 })
  const sun = endOfWeek(now, { weekStartsOn: 1 })
  return `${format(mon, 'd MMM', { locale: es })} – ${format(sun, 'd MMM', { locale: es })}`
})

onMounted(async () => {
  if (!goal.value) return
  loading.value = true
  try {
    const now = new Date()
    const from = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const to = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const sessions = await studySessionCol.listByDateRange(auth.userId, from, to)
    studiedMinutes.value = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  } finally {
    loading.value = false
  }
})
</script>
