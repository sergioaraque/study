import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'

export function useKeyboardSearch() {
  const ui = useUiStore()

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      ui.searchOpen = !ui.searchOpen
    }
    if (e.key === 'Escape') {
      ui.searchOpen = false
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
