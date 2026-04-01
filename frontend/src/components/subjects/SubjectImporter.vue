<template>
  <div class="space-y-4">
    <div>
      <p class="text-xs text-[var(--color-text-muted)] mb-3">
        Escribe una asignatura por línea con el formato:<br>
        <code class="text-[var(--color-primary)]">Nombre | Créditos | Descripción (opcional) | Código (opcional)</code>
      </p>
      <textarea
        v-model="raw"
        rows="8"
        placeholder="Matemáticas I | 6&#10;Física General | 6 | Asignatura de primer año&#10;Historia del Arte | 4 | | 60021021&#10;Cálculo Numérico | 6"
        class="w-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] resize-none font-mono"
      />
    </div>

    <!-- Preview -->
    <div v-if="parsed.length">
      <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        Vista previa — {{ parsed.length }} asignatura{{ parsed.length !== 1 ? 's' : '' }}
      </p>
      <div class="space-y-1.5 max-h-52 overflow-y-auto">
        <div
          v-for="(item, i) in parsed"
          :key="i"
          class="flex items-center gap-3 px-3 py-2 rounded-lg border text-xs"
          :class="item.error
            ? 'border-[var(--color-error)]/40 bg-[var(--color-error)]/5 text-[var(--color-error)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)]'"
        >
          <span v-if="item.error">⚠ {{ item.error }}</span>
          <template v-else>
            <span class="font-medium flex-1 truncate">{{ item.name }}</span>
            <span class="shrink-0 text-[var(--color-text-muted)]">{{ item.credits }} ECTS</span>
            <span v-if="item.code" class="shrink-0 text-[var(--color-text-muted)]">{{ item.code }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty parse -->
    <p v-else-if="raw.trim()" class="text-xs text-[var(--color-text-muted)] italic">
      No se reconoció ninguna asignatura.
    </p>

    <!-- Progress -->
    <div v-if="importing" class="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
      <span class="inline-block w-3 h-3 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      Importando {{ doneCount }}/{{ validParsed.length }}…
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-1">
      <button @click="$emit('cancel')" class="btn-secondary text-sm" :disabled="importing">
        Cancelar
      </button>
      <button
        @click="doImport"
        class="btn-primary text-sm"
        :disabled="!validParsed.length || importing"
      >
        Importar {{ validParsed.length > 0 ? validParsed.length : '' }} a la biblioteca
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ saved: []; cancel: [] }>()

const subjectStore = useSubjectStore()
const auth = useAuthStore()

const raw = ref('')
const importing = ref(false)
const doneCount = ref(0)

interface ParsedRow {
  name: string
  credits: number
  description?: string
  code?: string
  error?: string
}

const parsed = computed<ParsedRow[]>(() => {
  return raw.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim())
      const name = parts[0]
      const creditsRaw = parts[1]
      if (!name) return { name: '', credits: 0, error: 'Nombre vacío' }
      if (!creditsRaw) return { name, credits: 0, error: `"${name}" — falta el número de créditos` }
      const credits = parseFloat(creditsRaw)
      if (isNaN(credits) || credits <= 0) return { name, credits: 0, error: `"${name}" — créditos inválidos: "${creditsRaw}"` }
      return {
        name,
        credits,
        description: parts[2] || undefined,
        code: parts[3] || undefined,
      }
    })
})

const validParsed = computed(() => parsed.value.filter((p) => !p.error))

async function doImport() {
  if (!validParsed.value.length) return
  importing.value = true
  doneCount.value = 0
  try {
    for (const item of validParsed.value) {
      await subjectStore.create({
        name: item.name,
        credits: item.credits,
        description: item.description,
        code: item.code,
        semester_id: '',
        user_id: auth.userId,
        status: 'pendiente',
        pec_weight: 0.4,
      })
      doneCount.value++
    }
    emit('saved')
  } finally {
    importing.value = false
  }
}
</script>
