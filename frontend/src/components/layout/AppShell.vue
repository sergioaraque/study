<template>
  <div class="flex h-screen overflow-hidden bg-[var(--color-surface-2)]">
    <Sidebar :open="ui.sidebarOpen" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
    <GlobalSearchModal v-if="ui.searchOpen" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useKeyboardSearch } from '@/composables/useKeyboardSearch'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import GlobalSearchModal from '@/components/search/GlobalSearchModal.vue'

const ui = useUiStore()
useKeyboardSearch()
</script>
