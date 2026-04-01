<template>
  <div class="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] group">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-[var(--color-text)]">Examen — {{ subject.name }}</h3>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="$emit('edit')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><Pencil :size="12" /></button>
        <button @click="$emit('delete')" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 :size="12" /></button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="conv in [1, 2]"
        :key="conv"
        class="p-2.5 rounded-lg border"
        :class="exam.chosen_convocatoria === conv
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)]'"
      >
        <div class="text-xs font-medium text-[var(--color-text-muted)] mb-1">
          Convocatoria {{ conv }}
          <span v-if="exam.chosen_convocatoria === conv" class="text-[var(--color-primary)] ml-1">✓</span>
        </div>
        <div class="text-sm text-[var(--color-text)]">
          {{ formatDate(conv === 1 ? exam.convocatoria_1_date : exam.convocatoria_2_date) }}
        </div>
        <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
          {{ conv === 1 ? exam.convocatoria_1_location : exam.convocatoria_2_location }}
        </div>
        <div v-if="convGrade(conv) !== undefined" class="text-xs font-medium text-[var(--color-success)] mt-1">
          Nota: {{ convGrade(conv) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Exam, Subject } from '@/types'

const props = defineProps<{ exam: Exam; subject: Subject }>()
defineEmits<{ edit: []; delete: [] }>()

function formatDate(d: string | undefined) {
  if (!d) return 'Sin fecha'
  return format(new Date(d), "d MMM yyyy, HH:mm", { locale: es })
}

function convGrade(conv: number) {
  return conv === 1 ? props.exam.grade_c1 : props.exam.grade_c2
}
</script>
