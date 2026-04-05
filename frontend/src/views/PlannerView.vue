<template>
  <div>
    <!-- Header -->
    <div class="mb-5">
      <!-- Row 1: title + week/month toggle -->
      <div class="flex items-center justify-between mb-3 gap-3">
        <h1 class="text-xl font-semibold text-[var(--color-text)]">Planificador</h1>
        <div class="flex rounded-lg border border-[var(--color-border)] overflow-hidden text-xs shrink-0">
          <button
            @click="viewMode = 'week'"
            class="px-3 py-1.5 transition-colors"
            :class="viewMode === 'week' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'"
          >Semana</button>
          <button
            @click="switchToMonth"
            class="px-3 py-1.5 transition-colors"
            :class="viewMode === 'month' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'"
          >Mes</button>
          <button
            @click="switchToAgenda"
            class="px-3 py-1.5 transition-colors"
            :class="viewMode === 'agenda' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'"
          >Agenda</button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 mb-2">
        <p class="text-[11px] text-[var(--color-text-muted)]">Ajusta la densidad de la vista para ver más contenido o más espacio.</p>
        <button
          @click="toggleDensity"
          class="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] transition-colors"
          :class="compactMode ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'"
        >
          {{ compactMode ? 'Compacto' : 'Cómodo' }}
        </button>
      </div>

      <!-- Row 2: navigation + actions -->
      <div class="flex items-center gap-2">
        <template v-if="viewMode === 'week'">
          <button @click="planner.prevWeek()" class="btn-secondary p-1.5 shrink-0"><ChevronLeft :size="16" /></button>
          <span class="text-sm font-medium text-[var(--color-text)] flex-1 text-center">{{ planner.weekLabel }}</span>
          <button @click="planner.nextWeek()" class="btn-secondary p-1.5 shrink-0"><ChevronRight :size="16" /></button>
        </template>
        <template v-else>
          <button @click="planner.prevMonth()" class="btn-secondary p-1.5 shrink-0"><ChevronLeft :size="16" /></button>
          <span class="text-sm font-medium text-[var(--color-text)] flex-1 text-center capitalize">{{ planner.monthLabel }}</span>
          <button @click="planner.nextMonth()" class="btn-secondary p-1.5 shrink-0"><ChevronRight :size="16" /></button>
        </template>
        <button
          @click="viewMode === 'week' ? planner.goToCurrentWeek() : planner.goToCurrentMonth()"
          class="btn-secondary text-xs shrink-0"
        >Hoy</button>
        <button @click="showSchedule = true" class="btn-secondary text-xs shrink-0 flex items-center gap-1">
          <Clock :size="13" />
          <span class="hidden sm:inline">Horario</span>
        </button>
      </div>

      <div class="mt-2 flex items-center justify-end gap-3 text-[11px] text-[var(--color-text-muted)]">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" /> Libre</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]" /> Ajustado</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[var(--color-error)]" /> Sobrecargado</span>
      </div>
    </div>

    <!-- Week view -->
    <div v-if="viewMode === 'week'" class="pb-4">
      <!-- Mobile: collapsible panel above the grid -->
      <div class="lg:hidden mb-3">
        <button
          @click="mobileUnassignedOpen = !mobileUnassignedOpen"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
        >
          <span class="font-medium text-[var(--color-text)] flex items-center gap-2">
            Sin asignar
            <span
              v-if="planner.overdueTopics.length"
              class="text-xs text-[var(--color-warning)] font-semibold"
            >· {{ planner.overdueTopics.length }} atrasados</span>
          </span>
          <ChevronDown :size="14" class="transition-transform text-[var(--color-text-muted)]" :class="mobileUnassignedOpen ? 'rotate-180' : ''" />
        </button>
        <div v-if="mobileUnassignedOpen" class="mt-2">
          <UnassignedPanel
            :subject-ids="subjectIds"
            @assign="planner.fetchWeek()"
            @move-to-today="moveToToday"
          />
        </div>
      </div>

      <!-- Week grid + desktop sidebar -->
      <div class="flex gap-4">
        <!-- Desktop sidebar (hidden on mobile) -->
        <UnassignedPanel
          class="hidden lg:flex"
          :subject-ids="subjectIds"
          @assign="planner.fetchWeek()"
          @move-to-today="moveToToday"
        />
        <!-- 7-day grid: always scrolls horizontally -->
        <div class="flex-1 min-w-0 overflow-x-auto pb-2">
          <div class="flex gap-2 min-w-max">
            <WeekColumn
              v-for="day in planner.weekDays"
              :key="format(day, 'yyyy-MM-dd')"
              :day="day"
              :topics="planner.topicsForDay(day, 'week')"
              :tutorings="planner.tutoringsForDay(day, 'week')"
              :subjects="subjectMap"
              :available-hours="availableHoursForDay(day)"
              :compact="compactMode"
              @drop="(topicId, subjectId) => planner.assignTopicToDay(topicId, subjectId, day)"
              @remove="(topicId, subjectId) => planner.assignTopicToDay(topicId, subjectId, null)"
              @click-day="selectedDay = day"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Month view -->
    <div v-else-if="viewMode === 'month'" class="flex flex-col lg:flex-row gap-4">
      <!-- Sidebar: below on mobile, left on desktop -->
      <div class="w-full lg:w-48 lg:shrink-0">
        <UnassignedPanel
          :subject-ids="subjectIds"
          compact
          @assign="planner.fetchMonth()"
          @move-to-today="moveToToday"
        />
      </div>
      <div class="flex-1 min-w-0 overflow-x-auto">
        <PlannerMonthView :subjects="subjectMap" :compact="compactMode" />
      </div>
    </div>

    <!-- Agenda view -->
    <div v-else class="flex flex-col lg:flex-row gap-4">
      <div class="w-full lg:w-48 lg:shrink-0">
        <UnassignedPanel
          :subject-ids="subjectIds"
          compact
          @assign="planner.fetchMonth()"
          @move-to-today="moveToToday"
        />
      </div>
      <div class="flex-1 min-w-0 overflow-hidden">
        <PlannerAgendaView :subjects="subjectMap" :compact="compactMode" />
      </div>
    </div>

    <!-- Day panel -->
    <DayPanel
      :open="selectedDay !== null"
      :day="selectedDay"
      :topics="selectedDayTopics"
      :tutorings="selectedDayTutorings"
      :subjects="subjectMap"
      :compact="compactMode"
      @close="selectedDay = null"
      @move-to-today="(topicId, subjectId) => { moveToToday(topicId, subjectId); selectedDay = null }"
    />

    <!-- Schedule modal -->
    <Teleport to="body">
      <div
        v-if="showSchedule"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="showSchedule = false"
      >
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-[var(--color-text)]">Horario de estudio semanal</h2>
            <button @click="showSchedule = false" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <X :size="18" />
            </button>
          </div>
          <p class="text-xs text-[var(--color-text-muted)] mb-4">
            Indica cuántas horas tienes disponibles para estudiar cada día. Se usará para calcular tu capacidad semanal.
          </p>
          <WeeklyScheduleEditor :model-value="editSchedule" @update:model-value="val => Object.assign(editSchedule, val)" />
          <div class="flex justify-end gap-2 mt-5">
            <button @click="showSchedule = false" class="btn-secondary text-sm">Cancelar</button>
            <button @click="saveSchedule" :disabled="saving" class="btn-primary text-sm">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { format, getISODay } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown, Clock, X } from 'lucide-vue-next'
import { usePlannerStore } from '@/stores/planner'
import { useSubjectStore } from '@/stores/subject'
import { useSemesterStore } from '@/stores/semester'
import type { TutoringSession, WeeklySchedule } from '@/types'
import { parseSchedule } from '@/stores/semester'
import WeekColumn from '@/components/planner/WeekColumn.vue'
import UnassignedPanel from '@/components/planner/UnassignedPanel.vue'
import PlannerMonthView from '@/components/planner/PlannerMonthView.vue'
import PlannerAgendaView from '@/components/planner/PlannerAgendaView.vue'
import DayPanel from '@/components/planner/DayPanel.vue'
import WeeklyScheduleEditor from '@/components/semesters/WeeklyScheduleEditor.vue'

const planner = usePlannerStore()
const subjectStore = useSubjectStore()
const semesterStore = useSemesterStore()

const viewMode = ref<'week' | 'month' | 'agenda'>('week')
const selectedDay = ref<Date | null>(null)
const mobileUnassignedOpen = ref(false)
const COMPACT_KEY = 'study.planner.compact.v1'
const compactMode = ref(localStorage.getItem(COMPACT_KEY) === '1')

const subjectIds = computed(() => subjectStore.subjects.map((s) => s.$id))
const subjectMap = computed(() => Object.fromEntries(subjectStore.subjects.map((s) => [s.$id, s])))

const selectedDayTopics = computed(() =>
  selectedDay.value ? planner.topicsForDay(selectedDay.value, 'week') : []
)
const selectedDayTutorings = computed<TutoringSession[]>(() =>
  selectedDay.value ? planner.tutoringsForDay(selectedDay.value, 'week') : []
)

const DAY_KEYS: Record<number, keyof WeeklySchedule> = {
  1: 'hours_mon', 2: 'hours_tue', 3: 'hours_wed',
  4: 'hours_thu', 5: 'hours_fri', 6: 'hours_sat', 7: 'hours_sun',
}

function availableHoursForDay(day: Date): number {
  const sch = semesterStore.activeSchedule
  return sch[DAY_KEYS[getISODay(day)]] ?? 0
}

function switchToMonth() {
  viewMode.value = 'month'
  planner.fetchMonth()
}

function switchToAgenda() {
  viewMode.value = 'agenda'
  planner.fetchMonth()
}

function toggleDensity() {
  compactMode.value = !compactMode.value
}

async function moveToToday(topicId: string, subjectId: string) {
  await planner.assignTopicToDay(topicId, subjectId, new Date())
}

// Schedule modal
const showSchedule = ref(false)
const saving = ref(false)

const editSchedule = reactive<WeeklySchedule>({
  hours_mon: 0, hours_tue: 0, hours_wed: 0, hours_thu: 0,
  hours_fri: 0, hours_sat: 0, hours_sun: 0,
})

watch(
  () => semesterStore.activeSemester,
  (s) => { Object.assign(editSchedule, parseSchedule(s)) },
  { immediate: true }
)

watch(compactMode, (value) => {
  localStorage.setItem(COMPACT_KEY, value ? '1' : '0')
})

async function saveSchedule() {
  const s = semesterStore.activeSemester
  if (!s) return
  saving.value = true
  try {
    await semesterStore.updateSchedule(s.$id, { ...editSchedule })
    showSchedule.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  compactMode.value = localStorage.getItem(COMPACT_KEY) === '1'
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  await planner.fetchWeek()
  await planner.fetchOverdue()
})
</script>
