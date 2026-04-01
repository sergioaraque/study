<template>
  <div class="space-y-3">
    <p class="text-xs text-[var(--color-text-muted)]">
      Pega el índice de la asignatura. Cada línea es un tema. Se detectan automáticamente formatos como
      <code class="bg-[var(--color-surface-raised)] px-1 rounded">1. Título</code>,
      <code class="bg-[var(--color-surface-raised)] px-1 rounded">Tema 1 - Título</code>
      o líneas simples.
    </p>

    <textarea
      v-model="raw"
      rows="10"
      placeholder="1. Introducción a la programación&#10;2. Variables y tipos de datos&#10;3. Control de flujo&#10;..."
      class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none placeholder:text-[var(--color-text-muted)]"
    />

    <!-- Preview -->
    <div v-if="parsed.length" class="rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)] max-h-48 overflow-y-auto">
      <div
        v-for="(t, i) in parsed"
        :key="i"
        class="flex items-center gap-2 px-3 py-1.5 text-xs"
      >
        <span class="text-[var(--color-text-muted)] w-5 shrink-0">{{ t.number }}</span>
        <span class="text-[var(--color-text)] truncate">{{ t.title }}</span>
      </div>
    </div>
    <p v-else-if="raw.trim()" class="text-xs text-[var(--color-text-muted)] italic">No se detectaron temas válidos.</p>

    <div class="flex gap-2">
      <button
        @click="importTopics"
        :disabled="!parsed.length || importing"
        class="btn-primary text-sm flex-1 disabled:opacity-50"
      >
        {{ importing ? `Importando ${progress}/${parsed.length}…` : `Importar ${parsed.length} temas` }}
      </button>
      <button @click="$emit('cancel')" class="btn-secondary text-sm">Cancelar</button>
    </div>

    <p v-if="error" class="text-xs text-[var(--color-error)]">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTopicStore } from '@/stores/topic'

const props = defineProps<{ subjectId: string; userId: string; startNumber: number }>()
const emit = defineEmits<{ imported: []; cancel: [] }>()

const topicStore = useTopicStore()
const raw = ref('')
const importing = ref(false)
const progress = ref(0)
const error = ref('')

const parsed = computed(() => {
  const lines = raw.value.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: { number: number; title: string }[] = []
  let counter = props.startNumber

  for (const line of lines) {
    // Patterns: "1. Title", "1- Title", "Tema 1. Title", "Tema 1 - Title", "T1. Title", plain text
    const match =
      line.match(/^(?:tema\s+)?(\d+)[.\-\s]+(.+)$/i) ||
      line.match(/^t(\d+)[.\-\s]+(.+)$/i)

    if (match) {
      results.push({ number: parseInt(match[1]), title: match[2].trim() })
    } else if (line.length > 1) {
      results.push({ number: counter, title: line })
      counter++
    }
  }

  // Re-number if numbers were out of order
  return results.map((r, i) => ({
    ...r,
    number: results[0]?.number !== undefined ? r.number : props.startNumber + i,
  }))
})

async function importTopics() {
  if (!parsed.value.length) return
  importing.value = true
  progress.value = 0
  error.value = ''

  try {
    for (const t of parsed.value) {
      await topicStore.create({
        subject_id: props.subjectId,
        user_id: props.userId,
        number: t.number,
        title: t.title,
        status: 'pendiente',
        real_hours: 0,
      })
      progress.value++
    }
    emit('imported')
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message ?? 'Error al importar'
  } finally {
    importing.value = false
  }
}
</script>
