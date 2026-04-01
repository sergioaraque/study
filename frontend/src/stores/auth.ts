import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { account } from '@/lib/appwrite'
import type { Models } from 'appwrite'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Models.User<Models.Preferences> | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.$id ?? '')

  async function init() {
    try {
      user.value = await account.get()
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password)
    user.value = await account.get()
  }

  async function logout() {
    await account.deleteSession('current')
    user.value = null
  }

  return { user, loading, isAuthenticated, userId, init, login, logout }
})
