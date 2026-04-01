<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-[var(--color-text)]">Temas</h2>
      <div class="flex items-center gap-2">
        <button @click="showImporter = true" class="btn-secondary flex items-center gap-1 text-xs">
          <Upload :size="13" /> Importar
        </button>
        <button @click="showForm = true" class="btn-primary flex items-center gap-1">
          <Plus :size="14" /> Añadir tema
        </button>
      </div>
    </div>

    <div v-if="!topics.length" class="text-center py-10 text-[var(--color-text-muted)] text-sm">
      No hay temas. Añade el primero o importa el índice de la asignatura.
    </div>

    <div v-else class="space-y-2">
      <TopicItem
        v-for="topic in topics"
        :key="topic.$id"
        :topic="topic"
        @status-change="(status) => topicStore.setStatus(topic.$id, subjectId, status)"
        @edit="editTopic(topic)"
        @delete="topicStore.remove(topic.$id, subjectId)"
      />
    </div>

    <!-- Topic form -->
    <BaseSidepanel :open="showForm" @close="closeForm" title="Tema">
      <TopicForm
        :topic="editingTopic"
        :subject-id="subjectId"
        :user-id="userId"
        :next-number="nextNumber"
        :subject-credits="subjectCredits"
        :total-topics="topics.length + 1"
        @saved="closeForm"
        @cancel="closeForm"
      />
    </BaseSidepanel>

    <!-- Importer -->
    <BaseSidepanel :open="showImporter" @close="showImporter = false" title="Importar temas">
      <TopicImporter
        :subject-id="subjectId"
        :user-id="userId"
        :start-number="nextNumber"
        @imported="onImported"
        @cancel="showImporter = false"
      />
    </BaseSidepanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Upload } from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import TopicItem from './TopicItem.vue'
import TopicForm from './TopicForm.vue'
import TopicImporter from './TopicImporter.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import type { Topic } from '@/types'

const props = defineProps<{ subjectId: string; userId: string; subjectCredits?: number }>()
const topicStore = useTopicStore()

const showForm = ref(false)
const showImporter = ref(false)
const editingTopic = ref<Topic | null>(null)

const topics = computed(() => topicStore.getBySubject(props.subjectId))
const nextNumber = computed(() => Math.max(0, ...topics.value.map((t) => t.number)) + 1)

onMounted(() => topicStore.fetchBySubject(props.subjectId))

function editTopic(topic: Topic) {
  editingTopic.value = topic
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTopic.value = null
}

async function onImported() {
  showImporter.value = false
  await topicStore.fetchBySubject(props.subjectId)
}
</script>
