<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-[var(--color-text)]">Tutorías</h2>
      <button @click="showForm = true" class="btn-primary flex items-center gap-1">
        <Plus :size="14" /> Nueva sesión
      </button>
    </div>

    <div v-if="!sessions.length" class="text-center py-10 text-[var(--color-text-muted)] text-sm">
      No hay sesiones de tutoría registradas.
    </div>

    <div v-else class="space-y-3">
      <TutoringItem
        v-for="session in sessions"
        :key="session.$id"
        :session="session"
        @edit="editSession(session)"
        @delete="tutoringStore.remove(session.$id, subject.$id)"
      />
    </div>

    <BaseSidepanel :open="showForm" @close="closeForm" title="Tutoría">
      <TutoringForm
        :session="editingSession"
        :subject-id="subject.$id"
        :user-id="subject.user_id"
        @saved="closeForm"
        @cancel="closeForm"
      />
    </BaseSidepanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useTutoringStore } from '@/stores/tutoring'
import TutoringItem from './TutoringItem.vue'
import TutoringForm from './TutoringForm.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import type { TutoringSession, Subject } from '@/types'

const props = defineProps<{ subject: Subject }>()
const tutoringStore = useTutoringStore()

const showForm = ref(false)
const editingSession = ref<TutoringSession | null>(null)
const sessions = computed(() => tutoringStore.sessionsBySubject[props.subject.$id] ?? [])

onMounted(() => tutoringStore.fetchBySubject(props.subject.$id))

function editSession(s: TutoringSession) { editingSession.value = s; showForm.value = true }
function closeForm() { showForm.value = false; editingSession.value = null }
</script>
