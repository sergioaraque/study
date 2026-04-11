<template>
  <ErrorBoundary ref="errorBoundary">
    <RouterView />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { getErrorMessage } from '@/lib/errors'

const auth = useAuthStore()
const ui = useUiStore()
const errorBoundary = ref<InstanceType<typeof ErrorBoundary>>()

onMounted(async () => {
  try {
    ui.applyTheme()
    await auth.init()
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('Failed to initialize app:', message)
    // El auth store debe manejar esto, pero si hay error crítico, el ErrorBoundary lo capturará
    if (errorBoundary.value) {
      errorBoundary.value.handleError(error)
    }
  }
})
</script>

