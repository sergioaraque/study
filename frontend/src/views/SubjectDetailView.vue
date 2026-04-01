<template>
  <div v-if="subject">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6 gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button @click="router.push('/subjects')" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            <ChevronLeft :size="18" />
          </button>
          <SubjectStatusBadge :status="subject.status" />
          <span v-if="subject.code" class="text-xs text-[var(--color-text-muted)]">{{ subject.code }}</span>
        </div>
        <h1 class="text-xl font-semibold text-[var(--color-text)]">{{ subject.name }}</h1>
        <p v-if="subject.description" class="text-sm text-[var(--color-text-muted)] mt-1">{{ subject.description }}</p>
        <div class="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
          <span>{{ subject.credits }} créditos ECTS</span>
          <span v-if="subject.degree_year">· Año {{ subject.degree_year }}</span>
        </div>
      </div>
      <button @click="showEditForm = true" class="btn-secondary shrink-0">
        <Pencil :size="14" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-[var(--color-border)]">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === tab.id
          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <TopicsTab v-if="activeTab === 'topics'" :subject-id="subject.$id" :user-id="subject.user_id" :subject-credits="subject.credits" />
    <PecsTab v-else-if="activeTab === 'pecs'" :subject="subject" />
    <ExamsTab v-else-if="activeTab === 'exams'" :subject="subject" />
    <NotesTab v-else-if="activeTab === 'notes'" :subject="subject" />
    <TutoringTab v-else-if="activeTab === 'tutoring'" :subject="subject" />

    <!-- Edit form -->
    <BaseSidepanel :open="showEditForm" @close="showEditForm = false" title="Editar asignatura">
      <SubjectForm
        :subject="subject"
        :semester-id="subject.semester_id"
        :user-id="subject.user_id"
        @saved="onSubjectSaved"
        @cancel="showEditForm = false"
      />
    </BaseSidepanel>
  </div>

  <div v-else-if="notFound" class="text-center py-16 text-[var(--color-text-muted)]">
    <p>Asignatura no encontrada.</p>
    <button @click="router.push('/subjects')" class="btn-secondary mt-4">Volver</button>
  </div>

  <div v-else class="text-[var(--color-text-muted)] text-sm">Cargando…</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Pencil } from 'lucide-vue-next'
import { useSubjectStore } from '@/stores/subject'
import SubjectStatusBadge from '@/components/subjects/SubjectStatusBadge.vue'
import SubjectForm from '@/components/subjects/SubjectForm.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import TopicsTab from '@/components/topics/TopicsTab.vue'
import PecsTab from '@/components/pecs/PecsTab.vue'
import ExamsTab from '@/components/exams/ExamsTab.vue'
import NotesTab from '@/components/subjects/NotesTab.vue'
import TutoringTab from '@/components/tutoring/TutoringTab.vue'

const route = useRoute()
const router = useRouter()
const subjectStore = useSubjectStore()

const activeTab = ref('topics')
const showEditForm = ref(false)
const notFound = ref(false)

const tabs = [
  { id: 'topics', label: 'Temas' },
  { id: 'pecs', label: 'PECs' },
  { id: 'exams', label: 'Exámenes' },
  { id: 'notes', label: 'Notas' },
  { id: 'tutoring', label: 'Tutorías' },
]

const subject = computed(() => subjectStore.getById(route.params.id as string))

onMounted(async () => {
  await subjectStore.fetchActive()
  if (!subject.value) notFound.value = true
})

function onSubjectSaved() {
  showEditForm.value = false
  subjectStore.fetchActive()
}
</script>
