<template>
  <header class="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
    <button
      @click="ui.sidebarOpen = !ui.sidebarOpen"
      class="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      <Menu :size="18" />
    </button>

    <button
      @click="ui.searchOpen = true"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] transition-colors"
    >
      <Search :size="14" />
      <span>Buscar…</span>
      <span class="ml-2 text-xs opacity-50">Ctrl+K</span>
    </button>

    <ThemeToggle />
  </header>
</template>

<script setup lang="ts">
import { Menu, Search } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import ThemeToggle from './ThemeToggle.vue'

const ui = useUiStore()
</script>
