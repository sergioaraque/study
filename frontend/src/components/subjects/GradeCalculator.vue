<template>
  <div class="border border-[var(--color-border)] rounded-xl p-4">
    <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3">Calculadora de nota mínima</h3>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <BaseInput v-model.number="pecGrade" label="Nota PEC" type="number" step="0.1" min="0" max="10" placeholder="0-10" />
      <div>
        <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
          Peso PEC: {{ subject.pec_weight }}%
        </label>
        <p class="text-xs text-[var(--color-text-muted)] italic mt-2">Configurable en editar asignatura</p>
      </div>
    </div>

    <div v-if="pecGrade !== undefined" class="space-y-1.5">
      <div
        v-for="target in targets"
        :key="target.goal"
        class="flex items-center justify-between py-1.5 px-2 rounded-lg text-sm"
        :class="target.impossible
          ? 'opacity-40'
          : target.examGrade !== undefined && target.examGrade <= 10
            ? 'bg-[var(--color-surface-2)]'
            : 'opacity-40'"
      >
        <span class="text-[var(--color-text-muted)]">Nota {{ target.goal }}</span>
        <span v-if="target.impossible" class="text-[var(--color-danger)] text-xs">Imposible con esta PEC</span>
        <span v-else-if="target.examGrade !== undefined && target.examGrade > 10" class="text-[var(--color-danger)] text-xs">Necesita &gt;10 — imposible</span>
        <span v-else class="font-medium" :class="target.examGrade !== undefined && target.examGrade <= 5 ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'">
          {{ target.examGrade !== undefined ? `Necesitas un ${target.examGrade.toFixed(2)} en el examen` : '—' }}
        </span>
      </div>
    </div>

    <p v-else class="text-sm text-[var(--color-text-muted)] italic">
      Introduce la nota de la PEC para ver qué necesitas en el examen.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import type { Subject } from '@/types'

const props = defineProps<{ subject: Subject }>()

const pecGrade = ref<number | undefined>(props.subject.grade_pec)

const targets = computed(() => {
  if (pecGrade.value === undefined) return []
  const w = props.subject.pec_weight / 100
  return [5, 6, 7, 8, 9, 10].map((goal) => {
    // final = w * pec + (1 - w) * exam
    // exam = (final - w * pec) / (1 - w)
    const examGrade = (goal - w * pecGrade.value!) / (1 - w)
    const impossible = examGrade > 10
    return { goal, examGrade: +examGrade.toFixed(2), impossible }
  })
})
</script>
