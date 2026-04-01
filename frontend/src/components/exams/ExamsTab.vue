<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-[var(--color-text)]">Exámenes</h2>
      <div class="flex items-center gap-2">
        <button v-if="exams.length" @click="exportICS" class="btn-secondary flex items-center gap-1 text-xs">
          <CalendarDown :size="13" /> Exportar .ics
        </button>
        <button v-if="!exams.length" @click="showForm = true" class="btn-primary flex items-center gap-1">
          <Plus :size="14" /> Añadir examen
        </button>
      </div>
    </div>

    <div v-if="!exams.length" class="text-center py-10 text-[var(--color-text-muted)] text-sm">
      No hay exámenes registrados.
    </div>

    <div v-else class="space-y-4">
      <ExamCard
        v-for="exam in exams"
        :key="exam.$id"
        :exam="exam"
        :subject="subject"
        @edit="editExam(exam)"
        @delete="examStore.remove(exam.$id, subject.$id)"
      />
    </div>

    <BaseSidepanel :open="showForm" @close="closeForm" title="Examen">
      <ExamForm
        :exam="editingExam"
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
import { Plus, CalendarDown } from 'lucide-vue-next'
import { useExamStore } from '@/stores/exam'
import { generateExamsICS, downloadICS } from '@/lib/ics'
import ExamCard from './ExamCard.vue'
import ExamForm from './ExamForm.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import type { Exam, Subject } from '@/types'

const props = defineProps<{ subject: Subject }>()
const examStore = useExamStore()

const showForm = ref(false)
const editingExam = ref<Exam | null>(null)
const exams = computed(() => examStore.examsBySubject[props.subject.$id] ?? [])

onMounted(() => examStore.fetchBySubject(props.subject.$id))

function editExam(exam: Exam) { editingExam.value = exam; showForm.value = true }
function closeForm() { showForm.value = false; editingExam.value = null }

function exportICS() {
  const ics = generateExamsICS(exams.value, props.subject.name)
  if (ics) downloadICS(ics, `examenes-${props.subject.name.toLowerCase().replace(/\s+/g, '-')}.ics`)
}
</script>
