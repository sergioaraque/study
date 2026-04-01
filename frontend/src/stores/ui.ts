import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const theme = ref<'dark' | 'light'>((localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark')
  const searchOpen = ref(false)
  const sidebarOpen = ref(true)

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme.value)
    applyTheme()
  }

  // Apply on store creation
  applyTheme()

  return { theme, searchOpen, sidebarOpen, toggleTheme, applyTheme }
})
