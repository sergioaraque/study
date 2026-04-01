<template>
  <div>
    <h1 class="text-xl font-semibold text-[var(--color-text)] mb-6">Notificaciones push</h1>

    <div class="max-w-lg">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
        <!-- Support check -->
        <div v-if="!push.supported.value" class="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
          Tu navegador no soporta notificaciones push.
        </div>

        <template v-else>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-[var(--color-text)]">Notificaciones push</p>
              <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
                Permiso: <span :class="permissionColor">{{ push.permission.value }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs" :class="push.subscribed.value ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'">
                {{ push.subscribed.value ? 'Activo' : 'Inactivo' }}
              </span>
              <button
                @click="push.subscribed.value ? push.unsubscribe() : push.subscribe()"
                :disabled="push.loading.value"
                class="btn-primary text-xs"
                :class="push.subscribed.value ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : ''"
              >
                {{ push.subscribed.value ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>

          <p v-if="push.error.value" class="text-sm text-[var(--color-danger)]">{{ push.error.value }}</p>

          <div v-if="push.subscribed.value" class="p-3 rounded-lg bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 text-sm text-[var(--color-success)]">
            Las notificaciones están activas en este dispositivo. Recibirás avisos de PECs y exámenes según su configuración.
          </div>

          <div class="text-xs text-[var(--color-text-muted)] space-y-1 pt-2 border-t border-[var(--color-border)]">
            <p class="font-medium text-[var(--color-text)]">¿Cómo funciona?</p>
            <p>Los recordatorios se envían según los días de antelación que configures en cada PEC y examen.</p>
            <p>El backend los procesa diariamente a las 08:00.</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePushNotifications } from '@/composables/usePushNotifications'

const push = usePushNotifications()

const permissionColor = computed(() => ({
  'text-[var(--color-success)]': push.permission.value === 'granted',
  'text-[var(--color-danger)]': push.permission.value === 'denied',
  'text-[var(--color-text-muted)]': push.permission.value === 'default',
}))

onMounted(() => push.checkStatus())
</script>
