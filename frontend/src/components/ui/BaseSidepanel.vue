<template>
  <Teleport to="body">
    <Transition name="sidepanel">
      <div v-if="open" class="fixed inset-0 z-40 flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />
        <div class="relative w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 class="text-sm font-semibold text-[var(--color-text)]">{{ title }}</h2>
            <button @click="$emit('close')" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <X :size="18" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
defineProps<{ open: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.sidepanel-enter-active, .sidepanel-leave-active {
  transition: opacity 0.2s;
}
.sidepanel-enter-active .relative, .sidepanel-leave-active .relative {
  transition: transform 0.2s;
}
.sidepanel-enter-from, .sidepanel-leave-to {
  opacity: 0;
}
.sidepanel-enter-from .relative {
  transform: translateX(100%);
}
.sidepanel-leave-to .relative {
  transform: translateX(100%);
}
</style>
