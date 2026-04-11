import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { account } from '@/lib/appwrite'
import { AppError, ErrorCodes, parseApiError } from '@/lib/errors'
import type { Models } from 'appwrite'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Models.User<Models.Preferences> | null>(null)
  const loading = ref(true)
  const error = ref<AppError | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.$id ?? '')

  /**
   * Inicializa la sesión del usuario actual
   */
  async function init() {
    loading.value = true
    error.value = null

    try {
      user.value = await account.get()
    } catch (err) {
      // Si es 401, el usuario no está autenticado (esperado)
      const appError = parseApiError(err)
      if (appError.code === ErrorCodes.AUTH_UNAUTHORIZED) {
        user.value = null
        error.value = null
      } else {
        // Otros errores sí son significativos
        error.value = appError
        console.error('Auth init error:', appError.message)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Login con email/password
   */
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      await account.createEmailPasswordSession(email, password)
      user.value = await account.get()
    } catch (err) {
      const appError = parseApiError(err)
      error.value = appError

      // Errores específicos de autenticación
      if (
        err instanceof Error
        && err.message?.includes('Invalid credentials')
      ) {
        error.value = new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS)
      }

      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout del usuario actual
   */
  async function logout() {
    loading.value = true
    error.value = null

    try {
      await account.deleteSession('current')
      user.value = null
    } catch (err) {
      const appError = parseApiError(err)
      error.value = appError
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpia el estado de error
   */
  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userId,
    init,
    login,
    logout,
    clearError,
  }
})
