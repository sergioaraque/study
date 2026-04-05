<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-[var(--color-text)]">Expediente académico</h1>
      <div class="flex items-center gap-2">
        <button @click="showColumnConfig = true" class="btn-secondary flex items-center gap-1.5 text-sm">
          <SlidersHorizontal :size="15" /> Columnas
        </button>
        <button @click="showImporter = true" class="btn-secondary flex items-center gap-1.5 text-sm">
          <Library :size="15" /> Importar asignaturas
        </button>
      </div>
    </div>

    <div
      v-if="!isColVisible('pec') && !isColVisible('examen') && !isColVisible('notaFinal')"
      class="mb-4 p-3 rounded-xl border border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 flex items-center justify-between gap-3"
    >
      <p class="text-xs text-[var(--color-text)]">
        Tienes ocultas todas las columnas de notas.
      </p>
      <button class="btn-secondary text-xs" @click="showAllGradeColumns">Mostrar notas</button>
    </div>

    <!-- Summary cards (enrolled subjects only) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <p class="text-xs text-[var(--color-text-muted)] mb-1">Créditos matriculados</p>
        <p class="text-2xl font-bold text-[var(--color-text)]">{{ totalCredits }}</p>
      </div>
      <div class="bg-[var(--color-surface)] border border-[var(--color-success)]/30 rounded-xl p-4">
        <p class="text-xs text-[var(--color-text-muted)] mb-1">Créditos superados</p>
        <p class="text-2xl font-bold text-[var(--color-success)]">{{ passedCredits }}</p>
        <p class="text-xs text-[var(--color-text-muted)] mt-0.5">{{ passedPct }}%</p>
      </div>
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <p class="text-xs text-[var(--color-text-muted)] mb-1">Créditos pendientes</p>
        <p class="text-2xl font-bold text-[var(--color-text)]">{{ totalCredits - passedCredits }}</p>
      </div>
      <div class="bg-[var(--color-surface)] border border-[var(--color-primary)]/30 rounded-xl p-4">
        <p class="text-xs text-[var(--color-text-muted)] mb-1">Nota media ponderada</p>
        <p class="text-2xl font-bold text-[var(--color-primary)]">
          {{ weightedAvg !== null ? weightedAvg.toFixed(2) : '—' }}
        </p>
        <p class="text-xs text-[var(--color-text-muted)] mt-0.5">sobre asignaturas calificadas</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mb-8">
      <div class="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
        <span>Progreso del grado</span>
        <span>{{ passedCredits }} / {{ totalCredits }} ECTS</span>
      </div>
      <div class="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          class="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
          :style="{ width: `${passedPct}%` }"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-sm text-[var(--color-text-muted)]">
      Cargando expediente…
    </div>

    <template v-else>
      <!-- Semester sections -->
      <div class="space-y-8">
        <div v-for="sem in semestersWithSubjects" :key="sem.$id">
          <!-- Semester header -->
          <div class="flex items-center gap-3 mb-3 flex-wrap">
            <h2 class="text-sm font-semibold text-[var(--color-text)]">{{ sem.name }}</h2>
            <span class="text-xs text-[var(--color-text-muted)]">
              {{ sem.start_date?.slice(0, 10) }} → {{ sem.end_date?.slice(0, 10) }}
            </span>
            <span v-if="sem.is_active" class="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium">
              activo
            </span>
            <span class="ml-auto text-xs text-[var(--color-text-muted)]">
              {{ semesterPassedCredits(sem.$id) }} / {{ semesterTotalCredits(sem.$id) }} ECTS superados
            </span>
          </div>

          <!-- Subjects table -->
          <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                  <th class="text-left px-4 py-2.5 font-medium">Asignatura</th>
                  <th v-if="isColVisible('ects')" class="text-center px-3 py-2.5 font-medium">ECTS</th>
                  <th v-if="isColVisible('estado')" class="text-center px-3 py-2.5 font-medium">Estado</th>
                  <th v-if="isColVisible('pec')" class="text-center px-3 py-2.5 font-medium">PECs</th>
                  <th v-if="isColVisible('examen')" class="text-center px-3 py-2.5 font-medium">Examen</th>
                  <th v-if="isColVisible('notaFinal')" class="text-center px-3 py-2.5 font-medium">Nota final</th>
                  <th class="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="subject in subjectsBySemester[sem.$id] ?? []"
                  :key="subject.$id"
                  class="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)] transition-colors"
                  :class="{ 'opacity-60': subject.status === 'pendiente' }"
                >
                  <td class="px-4 py-3">
                    <p class="font-medium text-[var(--color-text)]">
                      {{ subject.name }}
                      <span v-if="subject.code" class="text-xs text-[var(--color-text-muted)] ml-1">({{ subject.code }})</span>
                    </p>
                    <p v-if="subject.description" class="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                      {{ subject.description }}
                    </p>
                  </td>
                  <td v-if="isColVisible('ects')" class="px-3 py-3 text-center">
                    <span class="text-sm font-medium text-[var(--color-text)]">{{ subject.credits }}</span>
                  </td>
                  <td v-if="isColVisible('estado')" class="px-3 py-3 text-center">
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(subject.status)">
                      {{ subject.status }}
                    </span>
                  </td>
                  <td v-if="isColVisible('pec')" class="px-3 py-3 text-center">
                    <span v-if="subject.grade_pec != null" class="text-sm" :class="gradeClass(subject.grade_pec)">
                      {{ subject.grade_pec.toFixed(1) }}
                    </span>
                    <span v-else class="text-xs text-[var(--color-text-muted)]">—</span>
                  </td>
                  <td v-if="isColVisible('examen')" class="px-3 py-3 text-center">
                    <span v-if="bestExamGrade(subject) != null" class="text-sm" :class="gradeClass(bestExamGrade(subject)!)">
                      {{ bestExamGrade(subject)!.toFixed(1) }}
                    </span>
                    <span v-else class="text-xs text-[var(--color-text-muted)]">—</span>
                  </td>
                  <!-- Final grade (editable) -->
                  <td v-if="isColVisible('notaFinal')" class="px-3 py-3 text-center">
                    <button
                      v-if="editingId !== subject.$id"
                      @click="startEdit(subject)"
                      class="group flex items-center justify-center gap-1 mx-auto"
                      title="Haz clic para editar"
                    >
                      <span v-if="subject.grade_final != null" class="text-sm font-semibold" :class="gradeClass(subject.grade_final)">
                        {{ subject.grade_final.toFixed(2) }}
                      </span>
                      <span v-else-if="computedFinal(subject) != null" class="text-xs text-[var(--color-text-muted)] italic">
                        ~{{ computedFinal(subject)!.toFixed(1) }}
                      </span>
                      <span v-else class="text-xs text-[var(--color-text-muted)]">—</span>
                      <Pencil :size="11" class="opacity-0 group-hover:opacity-40 text-[var(--color-text-muted)] transition-opacity" />
                    </button>
                    <input
                      v-else
                      :ref="(el) => { if (el) gradeInputRef = el as HTMLInputElement }"
                      v-model="editValue"
                      type="number" min="0" max="10" step="0.01"
                      class="w-16 text-center text-sm bg-transparent border border-[var(--color-primary)] rounded px-1 py-0.5 outline-none text-[var(--color-text)]"
                      @keydown.enter="commitEdit(subject)"
                      @keydown.escape="editingId = null"
                      @blur="commitEdit(subject)"
                    />
                  </td>
                  <!-- Actions -->
                  <td class="px-2 py-3">
                    <div class="relative" v-if="menuOpenId === subject.$id">
                      <div class="absolute right-0 top-0 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg py-1 min-w-40">
                        <button
                          @click="changeSemesterTarget = subject; menuOpenId = null"
                          class="w-full text-left text-xs px-3 py-2 hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] flex items-center gap-2"
                        >
                          <ArrowLeftRight :size="12" /> Cambiar semestre
                        </button>
                        <button
                          @click="doMoveToLibrary(subject); menuOpenId = null"
                          class="w-full text-left text-xs px-3 py-2 hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] flex items-center gap-2"
                        >
                          <Library :size="12" /> Mover a biblioteca
                        </button>
                      </div>
                    </div>
                    <button
                      @click="menuOpenId = menuOpenId === subject.$id ? null : subject.$id"
                      class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded transition-colors"
                    >
                      <MoreVertical :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-[var(--color-surface-raised)] text-xs text-[var(--color-text-muted)]">
                  <td class="px-4 py-2 font-medium text-[var(--color-text)]">Total semestre</td>
                  <td v-if="isColVisible('ects')" class="px-3 py-2 text-center font-semibold text-[var(--color-text)]">{{ semesterTotalCredits(sem.$id) }}</td>
                  <td v-if="isColVisible('estado')" class="px-3 py-2 text-center">
                    <span class="text-[var(--color-success)] font-medium">{{ semesterPassedCredits(sem.$id) }} superados</span>
                  </td>
                  <td :colspan="footerTailColspan" class="px-3 py-2 text-center">
                    <span v-if="semesterAvg(sem.$id) !== null">
                      Media: <strong class="text-[var(--color-text)]">{{ semesterAvg(sem.$id)!.toFixed(2) }}</strong>
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="!semestersWithSubjects.length && !librarySubjects.length" class="text-center py-16 text-sm text-[var(--color-text-muted)]">
          No hay asignaturas registradas todavía.
        </div>
      </div>

      <!-- Library section -->
      <div v-if="librarySubjects.length" class="mt-10">
        <div class="flex items-center gap-3 mb-4">
          <Library :size="15" class="text-[var(--color-text-muted)]" />
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Biblioteca</h2>
          <span class="text-xs text-[var(--color-text-muted)]">{{ librarySubjects.length }} asignatura{{ librarySubjects.length !== 1 ? 's' : '' }} sin matricular</span>
        </div>
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div
            v-for="(subject, i) in librarySubjects"
            :key="subject.$id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors"
            :class="{ 'border-t border-[var(--color-border)]': i > 0 }"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[var(--color-text)] truncate">
                {{ subject.name }}
                <span v-if="subject.code" class="text-xs text-[var(--color-text-muted)] ml-1">({{ subject.code }})</span>
              </p>
              <p v-if="subject.description" class="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{{ subject.description }}</p>
            </div>
            <span class="text-xs text-[var(--color-text-muted)] shrink-0">{{ subject.credits }} ECTS</span>
            <!-- Semester picker -->
            <div class="relative shrink-0">
              <select
                class="text-xs bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-muted)] cursor-pointer hover:border-[var(--color-primary)] outline-none appearance-none pr-6"
                @change="onLinkSemester(subject.$id, $event)"
              >
                <option value="">Matricular en…</option>
                <option v-for="sem in semesterStore.semesters" :key="sem.$id" :value="sem.$id">
                  {{ sem.name }}
                </option>
              </select>
              <ChevronDown :size="11" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Change semester modal -->
    <Teleport to="body">
      <div
        v-if="changeSemesterTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="changeSemesterTarget = null"
      >
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-sm font-semibold text-[var(--color-text)] mb-1">Cambiar semestre</h3>
          <p class="text-xs text-[var(--color-text-muted)] mb-4">
            Selecciona el semestre al que mover <strong>{{ changeSemesterTarget?.name }}</strong>.
          </p>
          <div class="space-y-2 mb-5">
            <button
              v-for="sem in semesterStore.semesters"
              :key="sem.$id"
              @click="doChangeSemester(changeSemesterTarget!.$id, sem.$id)"
              class="w-full text-left text-sm px-3 py-2.5 rounded-xl border transition-colors"
              :class="changeSemesterTarget?.semester_id === sem.$id
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)]'"
            >
              {{ sem.name }}
              <span v-if="changeSemesterTarget?.semester_id === sem.$id" class="text-xs ml-2 opacity-60">(actual)</span>
            </button>
          </div>
          <button @click="changeSemesterTarget = null" class="btn-secondary text-sm w-full">Cancelar</button>
        </div>
      </div>
    </Teleport>

    <!-- Subject importer sidepanel -->
    <BaseSidepanel :open="showImporter" @close="showImporter = false" title="Importar a biblioteca">
      <SubjectImporter @saved="onImported" @cancel="showImporter = false" />
    </BaseSidepanel>

    <!-- Column visibility sidepanel -->
    <BaseSidepanel :open="showColumnConfig" @close="showColumnConfig = false" title="Columnas del expediente">
      <div class="space-y-3">
        <p class="text-xs text-[var(--color-text-muted)]">Activa o desactiva las columnas que quieres ver en la tabla.</p>
        <label
          v-for="option in columnOptions"
          :key="option.key"
          class="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <span class="text-sm text-[var(--color-text)]">{{ option.label }}</span>
          <input v-model="visibleColumns[option.key]" type="checkbox" class="h-4 w-4 accent-[var(--color-primary)]" />
        </label>
        <button
          class="btn-secondary text-sm w-full"
          @click="resetColumns"
        >
          Restablecer columnas
        </button>
      </div>
    </BaseSidepanel>

    <!-- Click outside to close menus -->
    <div v-if="menuOpenId" class="fixed inset-0 z-0" @click="menuOpenId = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Pencil, Library, MoreVertical, ArrowLeftRight, ChevronDown, SlidersHorizontal } from 'lucide-vue-next'
import { useSemesterStore } from '@/stores/semester'
import { useAuthStore } from '@/stores/auth'
import { subjectCol } from '@/lib/collections'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import SubjectImporter from '@/components/subjects/SubjectImporter.vue'
import type { Subject } from '@/types'

const semesterStore = useSemesterStore()
const auth = useAuthStore()

const loading = ref(true)
const showImporter = ref(false)
const showColumnConfig = ref(false)
const allSubjects = ref<Subject[]>([])
const menuOpenId = ref<string | null>(null)
const changeSemesterTarget = ref<Subject | null>(null)

type ColumnKey = 'ects' | 'estado' | 'pec' | 'examen' | 'notaFinal'
const COLUMN_PREFS_KEY = 'study.expediente.columns.v1'
const defaultColumns: Record<ColumnKey, boolean> = {
  ects: true,
  estado: true,
  pec: true,
  examen: true,
  notaFinal: false,
}
const visibleColumns = ref<Record<ColumnKey, boolean>>({ ...defaultColumns })
const columnOptions: Array<{ key: ColumnKey; label: string }> = [
  { key: 'ects', label: 'ECTS' },
  { key: 'estado', label: 'Estado' },
  { key: 'pec', label: 'PECs' },
  { key: 'examen', label: 'Examen' },
  { key: 'notaFinal', label: 'Nota final' },
]
const footerTailColspan = computed(() =>
  1
  + (visibleColumns.value.pec ? 1 : 0)
  + (visibleColumns.value.examen ? 1 : 0)
  + (visibleColumns.value.notaFinal ? 1 : 0)
)

function isColVisible(key: ColumnKey): boolean {
  return visibleColumns.value[key]
}

function resetColumns() {
  visibleColumns.value = { ...defaultColumns }
}

function showAllGradeColumns() {
  visibleColumns.value = {
    ...visibleColumns.value,
    pec: true,
    examen: true,
    notaFinal: true,
  }
}

// Enrolled subjects (have a semester)
const enrolledSubjects = computed(() => allSubjects.value.filter((s) => !!s.semester_id))
// Library subjects (no semester)
const librarySubjects = computed(() => allSubjects.value.filter((s) => !s.semester_id).sort((a, b) => a.name.localeCompare(b.name)))

const subjectsBySemester = computed(() => {
  const map: Record<string, Subject[]> = {}
  for (const s of enrolledSubjects.value) {
    if (!map[s.semester_id]) map[s.semester_id] = []
    map[s.semester_id].push(s)
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.name.localeCompare(b.name))
  }
  return map
})

const semestersWithSubjects = computed(() =>
  semesterStore.semesters
    .filter((s) => (subjectsBySemester.value[s.$id]?.length ?? 0) > 0)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
)

// ── Grade helpers ─────────────────────────────────────────────────────────────

function bestExamGrade(s: Subject): number | null {
  const grades = [s.grade_exam_c1, s.grade_exam_c2].filter((g): g is number => g != null)
  return grades.length ? Math.max(...grades) : null
}

function computedFinal(s: Subject): number | null {
  const pec = s.grade_pec
  const exam = bestExamGrade(s)
  if (exam == null) return null
  if (pec == null) return exam
  return s.pec_weight * pec + (1 - s.pec_weight) * exam
}

function effectiveFinal(s: Subject): number | null {
  return s.grade_final ?? computedFinal(s)
}

function isPassed(s: Subject): boolean {
  if (s.status === 'aprobada' || s.status === 'convalidada') return true
  const g = effectiveFinal(s)
  return g != null && g >= 5
}

// ── Summary stats (enrolled only) ────────────────────────────────────────────

const totalCredits = computed(() =>
  enrolledSubjects.value.reduce((sum, s) => sum + (s.credits ?? 0), 0)
)
const passedCredits = computed(() =>
  enrolledSubjects.value.filter(isPassed).reduce((sum, s) => sum + (s.credits ?? 0), 0)
)
const passedPct = computed(() =>
  totalCredits.value > 0 ? Math.round((passedCredits.value / totalCredits.value) * 100) : 0
)
const weightedAvg = computed(() => {
  const graded = enrolledSubjects.value.filter((s) => isPassed(s) && effectiveFinal(s) != null)
  if (!graded.length) return null
  const sumW = graded.reduce((sum, s) => sum + effectiveFinal(s)! * s.credits, 0)
  const sumC = graded.reduce((sum, s) => sum + s.credits, 0)
  return sumC > 0 ? sumW / sumC : null
})

// ── Per-semester stats ────────────────────────────────────────────────────────

function semesterTotalCredits(semId: string) {
  return (subjectsBySemester.value[semId] ?? []).reduce((sum, s) => sum + (s.credits ?? 0), 0)
}
function semesterPassedCredits(semId: string) {
  return (subjectsBySemester.value[semId] ?? []).filter(isPassed).reduce((sum, s) => sum + (s.credits ?? 0), 0)
}
function semesterAvg(semId: string): number | null {
  const graded = (subjectsBySemester.value[semId] ?? []).filter((s) => isPassed(s) && effectiveFinal(s) != null)
  if (!graded.length) return null
  const sumW = graded.reduce((sum, s) => sum + effectiveFinal(s)! * s.credits, 0)
  const sumC = graded.reduce((sum, s) => sum + s.credits, 0)
  return sumC > 0 ? sumW / sumC : null
}

// ── CSS helpers ───────────────────────────────────────────────────────────────

function statusClass(status: string) {
  if (status === 'aprobada' || status === 'convalidada') return 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
  if (status === 'activa') return 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
  return 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
}
function gradeClass(grade: number) {
  if (grade >= 9) return 'text-[var(--color-success)] font-semibold'
  if (grade >= 7) return 'text-[var(--color-primary)]'
  if (grade >= 5) return 'text-[var(--color-text)]'
  return 'text-[var(--color-error)]'
}

// ── Inline grade editing ──────────────────────────────────────────────────────

const editingId = ref<string | null>(null)
const editValue = ref('')
const gradeInputRef = ref<HTMLInputElement | null>(null)

function startEdit(subject: Subject) {
  editingId.value = subject.$id
  editValue.value = subject.grade_final != null ? String(subject.grade_final) : ''
  nextTick(() => gradeInputRef.value?.select())
}

async function commitEdit(subject: Subject) {
  if (editingId.value !== subject.$id) return  // guard against Enter keydown + blur double-call
  editingId.value = null
  const val = parseFloat(editValue.value)
  if (!isNaN(val) && val >= 0 && val <= 10 && val !== subject.grade_final) {
    const updated = await subjectCol.update(subject.$id, {
      grade_final: val,
      status: val >= 5 ? 'aprobada' : subject.status,
    })
    const idx = allSubjects.value.findIndex((s) => s.$id === subject.$id)
    if (idx !== -1) allSubjects.value[idx] = updated
  }
}

// ── Semester actions ──────────────────────────────────────────────────────────

async function doMoveToLibrary(subject: Subject) {
  const updated = await subjectCol.update(subject.$id, { semester_id: '', status: 'pendiente' })
  const idx = allSubjects.value.findIndex((s) => s.$id === subject.$id)
  if (idx !== -1) allSubjects.value[idx] = updated
}

async function doChangeSemester(subjectId: string, semesterId: string) {
  const updated = await subjectCol.update(subjectId, { semester_id: semesterId })
  const idx = allSubjects.value.findIndex((s) => s.$id === subjectId)
  if (idx !== -1) allSubjects.value[idx] = updated
  changeSemesterTarget.value = null
}

async function onLinkSemester(subjectId: string, e: Event) {
  const el = e.target as HTMLSelectElement
  const semesterId = el.value
  if (!semesterId) return
  const updated = await subjectCol.update(subjectId, { semester_id: semesterId, status: 'activa' })
  const idx = allSubjects.value.findIndex((s) => s.$id === subjectId)
  if (idx !== -1) allSubjects.value[idx] = updated
  el.value = ''
}

async function onImported() {
  showImporter.value = false
  allSubjects.value = await subjectCol.listByUser(auth.userId)
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  const savedColumns = localStorage.getItem(COLUMN_PREFS_KEY)
  if (savedColumns) {
    try {
      const parsed = JSON.parse(savedColumns) as Partial<Record<ColumnKey, boolean>>
      visibleColumns.value = { ...defaultColumns, ...parsed }
    } catch {
      visibleColumns.value = { ...defaultColumns }
    }
  }

  await semesterStore.fetchAll()
  allSubjects.value = await subjectCol.listByUser(auth.userId)
  loading.value = false
})

watch(visibleColumns, (value) => {
  localStorage.setItem(COLUMN_PREFS_KEY, JSON.stringify(value))
}, { deep: true })
</script>
