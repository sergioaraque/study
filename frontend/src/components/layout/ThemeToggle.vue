<template>
  <button
    @click="ui.toggleTheme()"
    class="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
    :title="ui.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
  >
    <Sun v-if="ui.theme === 'dark'" :size="16" />
    <Moon v-else :size="16" />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>
