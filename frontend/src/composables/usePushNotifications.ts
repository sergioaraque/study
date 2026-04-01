import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const BACKEND_URL = () => import.meta.env.VITE_BACKEND_URL as string

export function usePushNotifications() {
  const supported = ref('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)
  const permission = ref<NotificationPermission>(supported.value ? Notification.permission : 'denied')
  const subscribed = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function getVapidPublicKey(): Promise<string> {
    const res = await fetch(`${BACKEND_URL()}/vapid/public-key`)
    const { publicKey } = await res.json() as { publicKey: string }
    return publicKey
  }

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

  async function subscribe() {
    if (!supported.value) return
    loading.value = true
    error.value = ''
    try {
      const perm = await Notification.requestPermission()
      permission.value = perm
      if (perm !== 'granted') { error.value = 'Permiso denegado'; return }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = await getVapidPublicKey()
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = subscription.toJSON()
      const auth = useAuthStore()

      await fetch(`${BACKEND_URL()}/push/subscribe`, {
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
      subscribed.value = true
    } catch (err: unknown) {
      error.value = (err as { message?: string }).message ?? 'Error al suscribirse'
    } finally {
      loading.value = false }
  }

  async function unsubscribe() {
    loading.value = true
    error.value = ''
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch(`${BACKEND_URL()}/push/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      subscribed.value = false
    } catch (err: unknown) {
      error.value = (err as { message?: string }).message ?? 'Error al cancelar'
    } finally { loading.value = false }
  }

  async function checkStatus() {
    if (!supported.value) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    subscribed.value = !!sub
    permission.value = Notification.permission
  }

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe, checkStatus }
}
