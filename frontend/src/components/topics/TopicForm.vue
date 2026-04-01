<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput v-model.number="form.number" label="Número" type="number" required />
    <BaseInput v-model="form.title" label="Título" required placeholder="Tema 1 — Introducción" />
    <BaseSelect v-model="form.status" label="Estado" :options="statusOptions" />
    <div class="grid grid-cols-2 gap-3">
      <div>
        <BaseInput v-model.number="form.estimated_hours" label="Horas estimadas" type="number" step="0.5" />
        <p v-if="suggestedHours && !form.estimated_hours" class="text-xs text-[var(--color-text-muted)] mt-1 cursor-pointer hover:text-[var(--color-primary)]" @click="form.estimated_hours = suggestedHours">
          Sugerido: ~{{ suggestedHours }}h ({{ subjectCredits }} ECTS / {{ totalTopics }} temas)
        </p>
      </div>
    </div>
    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Notas</label>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
      />
    </div>
    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    <div class="flex gap-2">
      <BaseButton type="submit" :loading="saving" class="flex-1">
        {{ topic ? 'Guardar' : 'Crear tema' }}
      </BaseButton>
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTopicStore } from '@/stores/topic'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Topic, TopicStatus } from '@/types'

const props = defineProps<{
  topic: Topic | null
  subjectId: string
  userId: string
  nextNumber: number
  subjectCredits?: number
  totalTopics?: number
}>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const topicStore = useTopicStore()
const saving = ref(false)
const error = ref('')

const suggestedHours = computed(() => {
  if (!props.subjectCredits || !props.totalTopics || props.topic) return null
  return Math.round((props.subjectCredits * 25) / props.totalTopics * 2) / 2 // round to 0.5
})

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
]

const form = ref({ number: props.nextNumber, title: '', status: 'pendiente' as TopicStatus, estimated_hours: undefined as number | undefined, notes: '' })

watch(() => props.topic, (t) => {
  if (t) form.value = { number: t.number, title: t.title, status: t.status, estimated_hours: t.estimated_hours, notes: t.notes ?? '' }
  else form.value.number = props.nextNumber
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (props.topic) {
      await topicStore.update(props.topic.$id, props.subjectId, { ...form.value })
    } else {
      await topicStore.create({
        ...form.value,
        subject_id: props.subjectId,
        user_id: props.userId,
        real_hours: 0,
      })
    }
    emit('saved')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error'
  } finally {
    saving.value = false
  }
}
</script>
