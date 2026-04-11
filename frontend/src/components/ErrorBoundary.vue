<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Error Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Error Message -->
        <h2 class="text-xl font-bold text-gray-900 text-center mb-2">Algo salió mal</h2>
        <p class="text-gray-600 text-center mb-6">{{ errorMessage }}</p>

        <!-- Error Details (Dev Only) -->
        <div v-if="isDevelopment && errorDetails" class="mb-6 p-3 bg-gray-100 rounded text-sm">
          <p class="font-mono text-gray-700 text-xs break-all">{{ errorDetails }}</p>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            type="button"
            @click="handleReload"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Volver a intentar
          </button>
          <button
            type="button"
            @click="handleGoHome"
            class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Volver al inicio
          </button>
        </div>

        <!-- Support Info -->
        <p class="text-xs text-gray-500 text-center mt-6">
          Si el problema persiste, contacta con soporte
        </p>
      </div>
    </div>
  </div>

  <!-- Render children if no error -->
  <template v-else>
    <slot />
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AppError, ErrorMessages, ErrorCodes } from '@/lib/errors'

const isDevelopment = import.meta.env.DEV

const hasError = ref(false)
const error = ref<Error | null>(null)

const router = useRouter()

const errorMessage = computed(() => {
  if (!error.value) return 'Ha ocurrido un error inesperado'

  if (error.value instanceof AppError) {
    return error.value.message
  }

  return error.value.message || ErrorMessages[ErrorCodes.INTERNAL_ERROR]
})

const errorDetails = computed(() => {
  if (!isDevelopment || !error.value) return null
  return error.value.message
})

/**
 * Maneja errores no capturados de componentes hijos
 */
function handleError(err: unknown) {
  console.error('[ErrorBoundary]', err)
  error.value = err instanceof Error ? err : new Error(String(err))
  hasError.value = true
}

/**
 * Recarga la página
 */
function handleReload() {
  hasError.value = false
  error.value = null
  window.location.reload()
}

/**
 * Va al inicio
 */
function handleGoHome() {
  hasError.value = false
  error.value = null
  router.push('/dashboard').catch(() => {
    window.location.href = '/'
  })
}

/**
 * Exponer método para que componentes padre puedan capturar errores
 */
defineExpose({
  handleError,
})
</script>
