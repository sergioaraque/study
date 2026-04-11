/**
 * Composable para manejo consistente de errores en operaciones async
 * Proporciona utilidades para capturar, loguear e informar errores
 */

import { ref } from 'vue'
import { AppError, parseApiError, ErrorMessages, ErrorCodes } from '@/lib/errors'
import type { ErrorCode } from '@/lib/errors'

interface UseErrorOptions {
  /**
   * Mostrar logging en consola
   */
  verbose?: boolean
  /**
   * Callback cuando ocurre un error
   */
  onError?: (error: AppError) => void
}

export function useError(options: UseErrorOptions = {}) {
  const { verbose = true, onError } = options

  const error = ref<AppError | null>(null)
  const isError = ref(false)

  /**
   * Maneja un error y lo convierte a AppError
   */
  function handleError(err: unknown, context?: string): AppError {
    let appError: AppError

    if (err instanceof AppError) {
      appError = err
    } else {
      appError = parseApiError(err)
    }

    error.value = appError
    isError.value = true

    if (verbose) {
      console.error(`[useError${context ? ` - ${context}` : ''}]`, appError.message)
    }

    onError?.(appError)

    return appError
  }

  /**
   * Limpia el estado de error
   */
  function clearError() {
    error.value = null
    isError.value = false
  }

  /**
   * Ejecuta una función async y captura errores
   */
  async function executeAsync<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    clearError()

    try {
      const data = await fn()
      return { data, error: null }
    } catch (err) {
      const appError = handleError(err, context)
      return { data: null, error: appError }
    }
  }

  return {
    error,
    isError,
    handleError,
    clearError,
    executeAsync,
    getMessage: () => error.value?.message ?? '',
    getCode: () => error.value?.code,
    is: (code: ErrorCode) => error.value?.code === code,
  }
}

/**
 * Hook para notificaciones toast de errores
 * (Asume que hay un composable/store de notificaciones disponible)
 */
export function useErrorNotification() {
  const notifyError = (message: string) => {
    // TODO: Integrar con store de notificaciones (toast)
    console.error('[Error Notification]:', message)
  }

  function handleApiError(err: unknown) {
    const appError = parseApiError(err)
    notifyError(appError.message)
    return appError
  }

  return {
    notifyError,
    handleApiError,
  }
}
