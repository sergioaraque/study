<template>
  <div class="prose-editor">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose-content focus:outline-none min-h-48',
    },
  },
})

watch(() => props.modelValue, (v) => {
  if (editor.value && editor.value.getHTML() !== v) {
    editor.value.commands.setContent(v)
  }
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
.prose-editor {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}
.prose-content {
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.6;
}
.prose-content p { margin: 0.5em 0; }
.prose-content h1, .prose-content h2, .prose-content h3 {
  font-weight: 600;
  margin: 0.75em 0 0.25em;
}
.prose-content ul, .prose-content ol { padding-left: 1.5em; }
.prose-content code {
  background: var(--color-border);
  border-radius: 3px;
  padding: 0.1em 0.3em;
  font-size: 0.85em;
}
</style>
