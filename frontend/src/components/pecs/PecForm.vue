<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput v-model="form.title" label="Título" required />
    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Descripción</label>
      <textarea v-model="form.description" rows="3"
        class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none" />
    </div>
    <BaseInput v-model="form.due_date" label="Fecha de entrega" type="date" />
    <BaseSelect v-model="form.status" label="Estado" :options="statusOptions" />
    <BaseInput v-model.number="form.grade" label="Nota (si calificada)" type="number" step="0.1" min="0" max="10" />
    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Recordatorios (días antes)</label>
      <div class="flex gap-2 flex-wrap">
        <label v-for="d in [14, 7, 3, 1]" :key="d" class="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
          <input type="checkbox" :value="d" v-model="reminderDays" class="accent-[var(--color-primary)]" />
          {{ d }}d
        </label>
      </div>
    </div>
    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    <div class="flex gap-2">
      <BaseButton type="submit" :loading="saving" class="flex-1">{{ pec ? 'Guardar' : 'Crear PEC' }}</BaseButton>
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePecStore } from '@/stores/pec'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Pec, PecStatus } from '@/types'

const props = defineProps<{ pec: Pec | null; subjectId: string; userId: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const pecStore = usePecStore()
const saving = ref(false)
const error = ref('')
const reminderDays = ref<number[]>([7, 3, 1])

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'calificada', label: 'Calificada' },
]

const form = ref({ title: '', description: '', due_date: '', status: 'pendiente' as PecStatus, grade: undefined as number | undefined })

watch(() => props.pec, (p) => {
  if (p) {
    form.value = { title: p.title, description: p.description ?? '', due_date: p.due_date?.slice(0, 10) ?? '', status: p.status, grade: p.grade }
    reminderDays.value = p.reminder_days ? (JSON.parse(p.reminder_days) as number[]) : [7, 3, 1]
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const data = { ...form.value, reminder_days: JSON.stringify(reminderDays.value) }
    if (props.pec) {
      await pecStore.update(props.pec.$id, props.subjectId, data)
    } else {
      await pecStore.create({ ...data, subject_id: props.subjectId, user_id: props.userId })
    }
    emit('saved')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error'
  } finally {
    saving.value = false
  }
}
</script>
