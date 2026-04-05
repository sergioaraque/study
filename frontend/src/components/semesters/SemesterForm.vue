<template>
  <form @submit.prevent="submit" class="space-y-5">
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-[var(--color-text)] mb-1">Nombre</label>
        <input
          v-model="form.name"
          required
          placeholder="Ej: 2024-2025 Primer Semestre"
          class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-[var(--color-text)] mb-1">Inicio</label>
          <input
            v-model="form.start_date"
            type="date"
            required
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--color-text)] mb-1">Fin</label>
          <input
            v-model="form.end_date"
            type="date"
            required
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>
    </div>

    <div>
      <p class="text-sm font-medium text-[var(--color-text)] mb-2">
        Horario de estudio
        <span class="text-xs text-[var(--color-text-muted)] font-normal ml-1">(horas disponibles por día)</span>
      </p>
      <WeeklyScheduleEditor :model-value="schedule" @update:model-value="val => Object.assign(schedule, val)" />
    </div>

    <div>
      <label class="block text-sm font-medium text-[var(--color-text)] mb-1">
        Objetivo semanal de estudio
        <span class="text-xs text-[var(--color-text-muted)] font-normal ml-1">(horas totales)</span>
      </label>
      <input
        v-model.number="form.weekly_hours_goal"
        type="number"
        min="1"
        max="80"
        placeholder="Ej: 15"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </div>

    <div class="flex justify-end gap-2 pt-1">
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 text-sm rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {{ props.semester ? 'Guardar' : 'Crear semestre' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useSemesterStore, parseSchedule, serializeSchedule } from '@/stores/semester'
import { semesterCol } from '@/lib/collections'
import type { Semester, WeeklySchedule } from '@/types'
import WeeklyScheduleEditor from './WeeklyScheduleEditor.vue'

const props = defineProps<{ semester?: Semester }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useSemesterStore()
const loading = ref(false)

const form = reactive({
  name: props.semester?.name ?? '',
  start_date: props.semester?.start_date?.slice(0, 10) ?? '',
  end_date: props.semester?.end_date?.slice(0, 10) ?? '',
  weekly_hours_goal: props.semester?.weekly_hours_goal ?? undefined as number | undefined,
})

const schedule = reactive<WeeklySchedule>(parseSchedule(props.semester))

watch(
  () => props.semester,
  (semester) => {
    form.name = semester?.name ?? ''
    form.start_date = semester?.start_date?.slice(0, 10) ?? ''
    form.end_date = semester?.end_date?.slice(0, 10) ?? ''
    form.weekly_hours_goal = semester?.weekly_hours_goal ?? undefined

    const parsed = parseSchedule(semester)
    Object.assign(schedule, parsed)
  },
  { immediate: true }
)

async function submit() {
  loading.value = true
  try {
    if (props.semester) {
      await semesterCol.update(props.semester.$id, {
        ...form,
        schedule_json: serializeSchedule(schedule),
      })
      await store.fetchAll()
    } else {
      await store.create({ ...form, ...schedule })
    }

    emit('saved')
  } finally {
    loading.value = false
  }
}
</script>
