<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="border border-[var(--color-border)] rounded-lg p-3 space-y-3">
      <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Convocatoria 1</p>
      <BaseInput v-model="form.c1_date" label="Fecha y hora" type="datetime-local" />
      <BaseInput v-model="form.c1_location" label="Lugar" placeholder="Sede Madrid" />
      <BaseInput v-model.number="form.grade_c1" label="Nota" type="number" step="0.1" min="0" max="10" />
    </div>

    <div class="border border-[var(--color-border)] rounded-lg p-3 space-y-3">
      <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Convocatoria 2</p>
      <BaseInput v-model="form.c2_date" label="Fecha y hora" type="datetime-local" />
      <BaseInput v-model="form.c2_location" label="Lugar" placeholder="Sede Madrid" />
      <BaseInput v-model.number="form.grade_c2" label="Nota" type="number" step="0.1" min="0" max="10" />
    </div>

    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Convocatoria elegida</label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="radio" v-model="form.chosen" :value="1" class="accent-[var(--color-primary)]" /> Conv. 1
        </label>
        <label class="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="radio" v-model="form.chosen" :value="2" class="accent-[var(--color-primary)]" /> Conv. 2
        </label>
      </div>
    </div>

    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Recordatorios (días antes)</label>
      <div class="flex gap-2 flex-wrap">
        <label v-for="d in [14, 7, 3, 1]" :key="d" class="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
          <input type="checkbox" :value="d" v-model="reminderDays" class="accent-[var(--color-primary)]" /> {{ d }}d
        </label>
      </div>
    </div>

    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    <div class="flex gap-2">
      <BaseButton type="submit" :loading="saving" class="flex-1">{{ exam ? 'Guardar' : 'Crear examen' }}</BaseButton>
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useExamStore } from '@/stores/exam'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Exam } from '@/types'

const props = defineProps<{ exam: Exam | null; subjectId: string; userId: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const examStore = useExamStore()
const saving = ref(false)
const error = ref('')
const reminderDays = ref<number[]>([7, 3, 1])
const form = ref({
  c1_date: '', c1_location: '', grade_c1: undefined as number | undefined,
  c2_date: '', c2_location: '', grade_c2: undefined as number | undefined,
  chosen: undefined as 1 | 2 | undefined,
})

watch(() => props.exam, (e) => {
  if (e) {
    form.value = {
      c1_date: e.convocatoria_1_date?.slice(0, 16) ?? '',
      c1_location: e.convocatoria_1_location ?? '',
      grade_c1: e.grade_c1,
      c2_date: e.convocatoria_2_date?.slice(0, 16) ?? '',
      c2_location: e.convocatoria_2_location ?? '',
      grade_c2: e.grade_c2,
      chosen: e.chosen_convocatoria,
    }
    reminderDays.value = e.reminder_days ? (JSON.parse(e.reminder_days) as number[]) : [7, 3, 1]
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true; error.value = ''
  try {
    const data = {
      convocatoria_1_date: form.value.c1_date || undefined,
      convocatoria_1_location: form.value.c1_location || undefined,
      grade_c1: form.value.grade_c1,
      convocatoria_2_date: form.value.c2_date || undefined,
      convocatoria_2_location: form.value.c2_location || undefined,
      grade_c2: form.value.grade_c2,
      chosen_convocatoria: form.value.chosen,
      reminder_days: JSON.stringify(reminderDays.value),
    }
    if (props.exam) {
      await examStore.update(props.exam.$id, props.subjectId, data)
    } else {
      await examStore.create({ ...data, subject_id: props.subjectId, user_id: props.userId })
    }
    emit('saved')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error'
  } finally { saving.value = false }
}
</script>
