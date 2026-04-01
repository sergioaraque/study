<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput v-model="form.name" label="Nombre" required />
    <BaseInput v-model="form.code" label="Código UNED" placeholder="21030098" />
    <div class="grid grid-cols-2 gap-3">
      <BaseInput v-model.number="form.credits" label="Créditos ECTS" type="number" required />
      <BaseInput v-model.number="form.degree_year" label="Año del grado" type="number" placeholder="1" />
    </div>
    <BaseInput v-model="form.description" label="Descripción breve" placeholder="Resumen de la asignatura" />
    <BaseSelect v-model="form.status" label="Estado" :options="statusOptions" />
    <BaseInput v-model.number="form.pec_weight" label="Peso PEC en nota final (%)" type="number" />

    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>

    <div class="flex gap-2 pt-2">
      <BaseButton type="submit" :loading="saving" class="flex-1">
        {{ subject ? 'Guardar cambios' : 'Crear asignatura' }}
      </BaseButton>
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Subject, SubjectStatus } from '@/types'

const props = defineProps<{
  subject: Subject | null
  semesterId: string
  userId: string
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()
const subjectStore = useSubjectStore()
const saving = ref(false)
const error = ref('')

const statusOptions = [
  { value: 'activa', label: 'Activa' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'convalidada', label: 'Convalidada' },
  { value: 'aprobada', label: 'Aprobada' },
]

const form = ref({
  name: '',
  code: '',
  credits: 6,
  degree_year: undefined as number | undefined,
  description: '',
  status: 'activa' as SubjectStatus,
  pec_weight: 40,
})

watch(() => props.subject, (s) => {
  if (s) {
    form.value = {
      name: s.name,
      code: s.code ?? '',
      credits: s.credits,
      degree_year: s.degree_year,
      description: s.description ?? '',
      status: s.status,
      pec_weight: s.pec_weight,
    }
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (props.subject) {
      await subjectStore.update(props.subject.$id, { ...form.value })
    } else {
      await subjectStore.create({
        ...form.value,
        semester_id: props.semesterId,
        user_id: props.userId,
      })
    }
    emit('saved')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>
