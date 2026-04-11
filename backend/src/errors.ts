/**
 * Catálogo de códigos de error estructurados
 * Formato: [ENTIDAD]_[OPERACIÓN]_[RAZÓN]
 */
export const ErrorCodes = {
  // Autenticación
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',

  // Push Notifications
  PUSH_INVALID_SUBSCRIPTION: 'PUSH_INVALID_SUBSCRIPTION',
  PUSH_SUBSCRIBE_FAILED: 'PUSH_SUBSCRIBE_FAILED',
  PUSH_UNSUBSCRIBE_FAILED: 'PUSH_UNSUBSCRIBE_FAILED',
  PUSH_SEND_FAILED: 'PUSH_SEND_FAILED',

  // Database
  DB_DOCUMENT_NOT_FOUND: 'DB_DOCUMENT_NOT_FOUND',
  DB_COLLECTION_NOT_FOUND: 'DB_COLLECTION_NOT_FOUND',
  DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',

  // Exam/PEC
  EXAM_NOT_FOUND: 'EXAM_NOT_FOUND',
  PEC_NOT_FOUND: 'PEC_NOT_FOUND',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Mapeo de códigos de error a mensajes públicos (user-friendly)
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Credenciales inválidas',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Debes iniciar sesión para acceder a este recurso',
  [ErrorCodes.AUTH_FORBIDDEN]: 'No tienes permiso para acceder a este recurso',

  [ErrorCodes.VALIDATION_ERROR]: 'Los datos proporcionados son inválidos',
  [ErrorCodes.INVALID_REQUEST]: 'Solicitud inválida',

  [ErrorCodes.PUSH_INVALID_SUBSCRIPTION]: 'Suscripción a notificaciones inválida',
  [ErrorCodes.PUSH_SUBSCRIBE_FAILED]: 'No se pudo suscribir a notificaciones',
  [ErrorCodes.PUSH_UNSUBSCRIBE_FAILED]: 'No se pudo desuscribirse de notificaciones',
  [ErrorCodes.PUSH_SEND_FAILED]: 'No se pudo enviar la notificación',

  [ErrorCodes.DB_DOCUMENT_NOT_FOUND]: 'Documento no encontrado',
  [ErrorCodes.DB_COLLECTION_NOT_FOUND]: 'Colección no encontrada',
  [ErrorCodes.DB_OPERATION_FAILED]: 'Error en operación de base de datos',

  [ErrorCodes.EXAM_NOT_FOUND]: 'Examen no encontrado',
  [ErrorCodes.PEC_NOT_FOUND]: 'PEC no encontrado',

  [ErrorCodes.INTERNAL_ERROR]: 'Ha ocurrido un error interno. Por favor, intenta más tarde',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'El servicio no está disponible. Por favor, intenta más tarde',
}

/**
 * Mapeo de códigos de error a códigos HTTP
 */
export const ErrorHttpCodes: Record<ErrorCode, number> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 401,
  [ErrorCodes.AUTH_UNAUTHORIZED]: 401,
  [ErrorCodes.AUTH_FORBIDDEN]: 403,

  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_REQUEST]: 400,

  [ErrorCodes.PUSH_INVALID_SUBSCRIPTION]: 400,
  [ErrorCodes.PUSH_SUBSCRIBE_FAILED]: 500,
  [ErrorCodes.PUSH_UNSUBSCRIBE_FAILED]: 500,
  [ErrorCodes.PUSH_SEND_FAILED]: 500,

  [ErrorCodes.DB_DOCUMENT_NOT_FOUND]: 404,
  [ErrorCodes.DB_COLLECTION_NOT_FOUND]: 404,
  [ErrorCodes.DB_OPERATION_FAILED]: 500,

  [ErrorCodes.EXAM_NOT_FOUND]: 404,
  [ErrorCodes.PEC_NOT_FOUND]: 404,

  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
}

/**
 * Error personalizado para la aplicación
 * Proporciona estructura consistente para todos los errores
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, any>

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, any>
  ) {
    const finalMessage = message || ErrorMessages[code]
    super(finalMessage)
    this.name = 'AppError'
    this.code = code
    this.statusCode = ErrorHttpCodes[code]
    this.details = details
  }

  /**
   * Serializar para enviar al cliente
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

/**
 * Helper para crear AppError desde errores de Appwrite
 */
export function createAppwriteError(error: any): AppError {
  // Si ya es AppError, devolverlo tal cual
  if (error instanceof AppError) {
    return error
  }

  // Appwrite error patterns
  if (error.code === 401) {
    return new AppError(ErrorCodes.AUTH_UNAUTHORIZED)
  }

  if (error.code === 403) {
    return new AppError(ErrorCodes.AUTH_FORBIDDEN)
  }

  if (error.code === 404) {
    return new AppError(ErrorCodes.DB_DOCUMENT_NOT_FOUND)
  }

  if (error.message?.includes('Document with the requested ID could not be found')) {
    return new AppError(ErrorCodes.DB_DOCUMENT_NOT_FOUND)
  }

  // Default: error interno genérico
  return new AppError(
    ErrorCodes.INTERNAL_ERROR,
    undefined,
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined
  )
}

/**
 * Helper para crear AppError desde errores de validación Zod
 */
export function createValidationError(zodError: any): AppError {
  const fieldErrors = zodError.flatten?.().fieldErrors || {}
  const messages = Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
    .join('; ')

  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    `Validación fallida: ${messages}`,
    { fields: fieldErrors }
  )
}
