import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useError } from './useError'
import { AppError, ErrorCodes } from '@/lib/errors'

const BACKEND_URL = () => import.meta.env.VITE_BACKEND_URL as string

export function usePushNotifications() {
  const { error, handleError, clearError, executeAsync } = useError({ verbose: false })

  const supported = ref('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)
  const permission = ref<NotificationPermission>(supported.value ? Notification.permission : 'denied')
  const subscribed = ref(false)
  const loading = ref(false)

  /**
   * Obtiene la clave pública VAPID del backend
   */
  async function getVapidPublicKey(): Promise<string> {
    const res = await fetch(`${BACKEND_URL()}/vapid/public-key`)
    if (!res.ok) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'No se pudo obtener la clave pública VAPID')
    }
    const data = (await res.json()) as { publicKey: string }
    return data.publicKey
  }

  /**
   * Convierte base64 a Uint8Array para VAPID
   */
  function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray.buffer as ArrayBuffer
  }

  /**
   * Se suscribe a notificaciones push
   */
  async function subscribe() {
    if (!supported.value) {
      handleError(
        new AppError(ErrorCodes.PUSH_SUBSCRIBE_FAILED, 'Tu navegador no soporta notificaciones push'),
        'subscribe'
      )
      return
    }

    const { error: execError } = await executeAsync(async () => {
      clearError()
      loading.value = true

      // Solicitar permiso de notificaciones
      const perm = await Notification.requestPermission()
      permission.value = perm

      if (perm !== 'granted') {
        throw new AppError(
          ErrorCodes.PUSH_SUBSCRIBE_FAILED,
          'Debes permitir notificaciones para suscribirse'
        )
      }

      // Obtener registro de service worker
      const reg = await navigator.serviceWorker.ready

      // Obtener clave VAPID
      const vapidKey = await getVapidPublicKey()

      // Suscribirse a push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = subscription.toJSON()
      const auth = useAuthStore()

      // Registrar en backend
      const res = await fetch(`${BACKEND_URL()}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.['p256dh'],
          auth: json.keys?.['auth'],
          userId: auth.userId,
          userAgent: navigator.userAgent,
        }),
      })

      if (!res.ok) {
        const errorData = (await res.json()) as any
        throw errorData.error || new AppError(ErrorCodes.PUSH_SUBSCRIBE_FAILED)
      }

      subscribed.value = true
    }, 'subscribe')

    loading.value = false

    return { success: !execError, error: execError }
  }

  /**
   * Se desuscribe de notificaciones push
   */
  async function unsubscribe() {
    const { error: execError } = await executeAsync(async () => {
      clearError()
      loading.value = true

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        const endpoint = sub.endpoint

        // Desuscribir localmente
        await sub.unsubscribe()

        // Notificar al backend
        const res = await fetch(`${BACKEND_URL()}/push/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })

        if (!res.ok) {
          throw new AppError(ErrorCodes.PUSH_UNSUBSCRIBE_FAILED)
        }
      }

      subscribed.value = false
    }, 'unsubscribe')

    loading.value = false

    return { success: !execError, error: execError }
  }

  /**
   * Verifica el estado actual de suscripción
   */
  async function checkStatus() {
    if (!supported.value) return

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      subscribed.value = !!sub
      permission.value = Notification.permission
    } catch (err) {
      handleError(err, 'checkStatus')
    }
  }

  return {
    supported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    checkStatus,
  }
}
