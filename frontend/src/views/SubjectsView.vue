<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-[var(--color-text)]">Asignaturas</h1>
      <div class="flex items-center gap-2">
        <button @click="showImporter = true" class="btn-secondary flex items-center gap-1.5 text-sm">
          <Library :size="15" />
          Biblioteca
        </button>
        <button @click="showForm = true" class="btn-primary flex items-center gap-1.5">
          <Plus :size="16" />
          Nueva asignatura
        </button>
      </div>
    </div>

    <div v-if="subjectStore.loading" class="text-[var(--color-text-muted)] text-sm">Cargando…</div>

    <div v-else-if="!semesterStore.activeSemester" class="text-center py-16 text-[var(--color-text-muted)]">
      <BookOpen :size="40" class="mx-auto mb-3 opacity-40" />
      <p class="text-sm mb-3">No hay ningún semestre activo.<br>Crea uno primero desde el Dashboard.</p>
      <RouterLink to="/" class="btn-primary text-xs">Ir al Dashboard</RouterLink>
    </div>

    <template v-else>
      <!-- Active semester subjects -->
      <div v-if="subjectStore.subjects.length === 0" class="text-center py-12 text-[var(--color-text-muted)]">
        <BookOpen :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm">No hay asignaturas en este semestre.<br>Crea una nueva o vincúlala desde la biblioteca.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SubjectCard
          v-for="subject in subjectStore.subjects"
          :key="subject.$id"
          :subject="subject"
          :topic-count="topicCountFor(subject.$id)"
          :completed-count="completedCountFor(subject.$id)"
          @click="router.push(`/subjects/${subject.$id}`)"
          @edit="editSubject(subject)"
          @delete="deleteSubject(subject)"
        />
      </div>

      <!-- Library section -->
      <div v-if="subjectStore.librarySubjects.length" class="mt-10">
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Biblioteca de asignaturas</h2>
          <span class="text-xs text-[var(--color-text-muted)]">sin semestre asignado</span>
          <button
            @click="showImporter = true"
            class="ml-auto text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            <Plus :size="12" /> Importar
          </button>
        </div>

        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div
            v-for="(subject, i) in subjectStore.librarySubjects"
            :key="subject.$id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors"
            :class="{ 'border-t border-[var(--color-border)]': i > 0 }"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[var(--color-text)] truncate">
                {{ subject.name }}
                <span v-if="subject.code" class="text-xs text-[var(--color-text-muted)] ml-1">({{ subject.code }})</span>
              </p>
              <p v-if="subject.description" class="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                {{ subject.description }}
              </p>
            </div>
            <span class="text-xs text-[var(--color-text-muted)] shrink-0">{{ subject.credits }} ECTS</span>

            <!-- Semester picker -->
            <div class="relative shrink-0">
              <select
                class="text-xs bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-muted)] cursor-pointer hover:border-[var(--color-primary)] outline-none appearance-none pr-6"
                @change="onLinkSemester(subject.$id, $event)"
              >
                <option value="">Vincular a semestre…</option>
                <option
                  v-for="sem in semesterStore.semesters"
                  :key="sem.$id"
                  :value="sem.$id"
                >{{ sem.name }}</option>
              </select>
              <ChevronDown :size="11" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" />
            </div>

            <button
              @click="editSubject(subject)"
              class="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Editar"
            >
              <Pencil :size="14" />
            </button>
            <button
              @click="deleteSubject(subject)"
              class="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
              title="Eliminar"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty library prompt (only if no library subjects) -->
      <div v-else-if="!subjectStore.librarySubjects.length" class="mt-8 flex items-center justify-center">
        <button
          @click="showImporter = true"
          class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors border border-dashed border-[var(--color-border)] rounded-xl px-4 py-3"
        >
          <Library :size="14" />
          Importar asignaturas a la biblioteca para matricularte rápido
        </button>
      </div>
    </template>

    <!-- Subject form sidepanel -->
    <BaseSidepanel :open="showForm" @close="closeForm" title="Asignatura">
      <SubjectForm
        :subject="editingSubject"
        :semester-id="editingSubject?.semester_id ?? semesterStore.activeSemester?.$id ?? ''"
        :user-id="authStore.userId"
        @saved="onSaved"
        @cancel="closeForm"
      />
    </BaseSidepanel>

    <!-- Subject importer sidepanel -->
    <BaseSidepanel :open="showImporter" @close="showImporter = false" title="Importar a biblioteca">
      <SubjectImporter @saved="onImported" @cancel="showImporter = false" />
    </BaseSidepanel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, BookOpen, Library, Pencil, ChevronDown, Trash2 } from 'lucide-vue-next'
import { useSubjectStore } from '@/stores/subject'
import { useSemesterStore } from '@/stores/semester'
import { useAuthStore } from '@/stores/auth'
import { useTopicStore } from '@/stores/topic'
import SubjectCard from '@/components/subjects/SubjectCard.vue'
import SubjectForm from '@/components/subjects/SubjectForm.vue'
import SubjectImporter from '@/components/subjects/SubjectImporter.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import type { Subject } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
const semesterStore = useSemesterStore()
const authStore = useAuthStore()
const topicStore = useTopicStore()

const showForm = ref(false)
const showImporter = ref(false)
const editingSubject = ref<Subject | null>(null)

onMounted(async () => {
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  await subjectStore.fetchLibrary()
  for (const subject of subjectStore.subjects) {
    await topicStore.fetchBySubject(subject.$id)
  }
})

function topicCountFor(subjectId: string) {
  return topicStore.getBySubject(subjectId).length
}

function completedCountFor(subjectId: string) {
  return topicStore.getBySubject(subjectId).filter((t) => t.status === 'completado').length
}

function editSubject(subject: Subject) {
  editingSubject.value = subject
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingSubject.value = null
}

async function deleteSubject(subject: Subject) {
  if (!confirm(`¿Eliminar "${subject.name}"? Se borrarán también todos sus temas y tareas.`)) return
  await subjectStore.remove(subject.$id)
}

async function onSaved() {
  closeForm()
  await subjectStore.fetchActive()
  await subjectStore.fetchLibrary()
}

async function onImported() {
  showImporter.value = false
  await subjectStore.fetchLibrary()
}

async function onLinkSemester(subjectId: string, e: Event) {
  const el = e.target as HTMLSelectElement
  const semesterId = el.value
  if (!semesterId) return
  await subjectStore.linkToSemester(subjectId, semesterId)
  el.value = ''
}
</script>
