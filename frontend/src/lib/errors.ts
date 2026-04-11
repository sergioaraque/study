/**
 * Códigos de error compartidos con el backend
 * (Espejo de backend/src/errors.ts)
 */
export const ErrorCodes = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',

  PUSH_INVALID_SUBSCRIPTION: 'PUSH_INVALID_SUBSCRIPTION',
  PUSH_SUBSCRIBE_FAILED: 'PUSH_SUBSCRIBE_FAILED',
  PUSH_UNSUBSCRIBE_FAILED: 'PUSH_UNSUBSCRIBE_FAILED',
  PUSH_SEND_FAILED: 'PUSH_SEND_FAILED',

  DB_DOCUMENT_NOT_FOUND: 'DB_DOCUMENT_NOT_FOUND',
  DB_COLLECTION_NOT_FOUND: 'DB_COLLECTION_NOT_FOUND',
  DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',

  EXAM_NOT_FOUND: 'EXAM_NOT_FOUND',
  PEC_NOT_FOUND: 'PEC_NOT_FOUND',

  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Frontend-specific
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Mensajes de error user-friendly para mostrar en UI
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Las credenciales no son válidas',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Debes iniciar sesión para acceder a este recurso',
  [ErrorCodes.AUTH_FORBIDDEN]: 'No tienes permiso para acceder a este recurso',

  [ErrorCodes.VALIDATION_ERROR]: 'Por favor, verifica los datos proporcionados',
  [ErrorCodes.INVALID_REQUEST]: 'La solicitud no es válida',

  [ErrorCodes.PUSH_INVALID_SUBSCRIPTION]: 'Suscripción a notificaciones inválida',
  [ErrorCodes.PUSH_SUBSCRIBE_FAILED]: 'No se pudo suscribir a notificaciones. Intenta de nuevo más tarde',
  [ErrorCodes.PUSH_UNSUBSCRIBE_FAILED]: 'No se pudo desuscribirse de notificaciones',
  [ErrorCodes.PUSH_SEND_FAILED]: 'No se pudo enviar la notificación',

  [ErrorCodes.DB_DOCUMENT_NOT_FOUND]: 'El recurso que buscas no existe',
  [ErrorCodes.DB_COLLECTION_NOT_FOUND]: 'Colección no encontrada',
  [ErrorCodes.DB_OPERATION_FAILED]: 'Error al procesar tu solicitud en la base de datos',

  [ErrorCodes.EXAM_NOT_FOUND]: 'El examen que buscas no existe',
  [ErrorCodes.PEC_NOT_FOUND]: 'El PEC que buscas no existe',

  [ErrorCodes.INTERNAL_ERROR]: 'Ha ocurrido un error. Por favor, intenta más tarde',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'El servicio no está disponible. Intenta más tarde',

  [ErrorCodes.NETWORK_ERROR]: 'Error de conexión. Por favor, verifica tu conexión a internet',
  [ErrorCodes.TIMEOUT]: 'La solicitud tardó demasiado. Intenta de nuevo',
}

/**
 * Error personalizado para la aplicación
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode?: number
  public readonly details?: Record<string, any>

  constructor(code: ErrorCode, message?: string, details?: Record<string, any>) {
    const finalMessage = message || ErrorMessages[code]
    super(finalMessage)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

/**
 * Parse de respuesta de error del servidor
 */
export interface ServerErrorResponse {
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, any>
  }
}

/**
 * Helper para parsear errores de respuesta API
 */
export function parseApiError(error: any): AppError {
  // Error de red o timeout
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new AppError(ErrorCodes.NETWORK_ERROR)
  }

  if (error?.name === 'AbortError') {
    return new AppError(ErrorCodes.TIMEOUT)
  }

  // Response JSON con estructura de error
  if (error?.response?.error?.code) {
    const serverError = error.response as ServerErrorResponse
    return new AppError(
      serverError.error.code,
      serverError.error.message,
      serverError.error.details
    )
  }

  // HTTP status codes
  if (error?.status === 401) {
    return new AppError(ErrorCodes.AUTH_UNAUTHORIZED)
  }

  if (error?.status === 403) {
    return new AppError(ErrorCodes.AUTH_FORBIDDEN)
  }

  if (error?.status === 404) {
    return new AppError(ErrorCodes.DB_DOCUMENT_NOT_FOUND)
  }

  if (error?.status === 503) {
    return new AppError(ErrorCodes.SERVICE_UNAVAILABLE)
  }

  if (error instanceof AppError) {
    return error
  }

  // Error desconocido
  return new AppError(
    ErrorCodes.INTERNAL_ERROR,
    error?.message
  )
}

/**
 * Helper para obtener el mensaje de error a mostrar
 */
export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error?.message) {
    return error.message
  }

  return ErrorMessages[ErrorCodes.INTERNAL_ERROR]
}
