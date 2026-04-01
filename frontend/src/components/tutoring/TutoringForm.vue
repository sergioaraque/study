<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput v-model="form.date" label="Fecha" type="datetime-local" required />
    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Notas de la sesión</label>
      <textarea v-model="form.notes" rows="5" placeholder="¿Qué se explicó?"
        class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none" />
    </div>
    <div>
      <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Tareas de repaso</label>
      <div v-for="(_task, i) in tasks" :key="i" class="flex gap-2 mb-2">
        <input v-model="tasks[i]" type="text" placeholder="Tarea de repaso…"
          class="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]" />
        <button type="button" @click="tasks.splice(i, 1)" class="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
          <X :size="14" />
        </button>
      </div>
      <button type="button" @click="tasks.push('')" class="text-xs text-[var(--color-primary)] hover:underline">
        + Añadir tarea
      </button>
    </div>
    <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    <div class="flex gap-2">
      <BaseButton type="submit" :loading="saving" class="flex-1">{{ session ? 'Guardar' : 'Crear sesión' }}</BaseButton>
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useTutoringStore } from '@/stores/tutoring'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { TutoringSession } from '@/types'

const props = defineProps<{ session: TutoringSession | null; subjectId: string; userId: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const tutoringStore = useTutoringStore()
const saving = ref(false)
const error = ref('')
const tasks = ref<string[]>([])
const form = ref({ date: '', notes: '' })

watch(() => props.session, (s) => {
  if (s) {
    form.value = { date: s.date.slice(0, 16), notes: s.notes ?? '' }
    tasks.value = s.review_tasks ? (JSON.parse(s.review_tasks) as string[]) : []
  } else {
    form.value.date = new Date().toISOString().slice(0, 16)
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true; error.value = ''
  try {
    const data = { ...form.value, review_tasks: JSON.stringify(tasks.value.filter(Boolean)) }
    if (props.session) {
      await tutoringStore.update(props.session.$id, props.subjectId, data)
    } else {
      await tutoringStore.create({ ...data, subject_id: props.subjectId, user_id: props.userId })
    }
    emit('saved')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error'
  } finally { saving.value = false }
}
</script>
