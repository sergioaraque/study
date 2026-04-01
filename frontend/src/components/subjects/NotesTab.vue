<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-[var(--color-text)]">Notas de la asignatura</h2>
      <span v-if="saving" class="text-xs text-[var(--color-text-muted)]">Guardando…</span>
    </div>
    <MarkdownEditor v-model="content" @update:model-value="scheduleAutoSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import type { Subject } from '@/types'

const props = defineProps<{ subject: Subject }>()
const subjectStore = useSubjectStore()
const content = ref(props.subject.notes_markdown ?? '')
const saving = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.subject.notes_markdown, (v) => {
  content.value = v ?? ''
})

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    saving.value = true
    await subjectStore.update(props.subject.$id, { notes_markdown: content.value })
    saving.value = false
  }, 1000)
}
</script>
