<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <h1 class="text-xl font-semibold text-[var(--color-text)]">Planificador</h1>
      <div class="flex items-center gap-2">
        <!-- Week/Month toggle -->
        <div class="flex rounded-lg border border-[var(--color-border)] overflow-hidden text-xs">
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
        </div>

        <!-- Navigation -->
        <template v-if="viewMode === 'week'">
          <button @click="planner.prevWeek()" class="btn-secondary p-1.5"><ChevronLeft :size="16" /></button>
          <span class="text-sm font-medium text-[var(--color-text)] min-w-44 text-center">{{ planner.weekLabel }}</span>
          <button @click="planner.nextWeek()" class="btn-secondary p-1.5"><ChevronRight :size="16" /></button>
          <button @click="planner.goToCurrentWeek()" class="btn-secondary text-xs">Hoy</button>
        </template>
        <template v-else>
          <button @click="planner.prevMonth()" class="btn-secondary p-1.5"><ChevronLeft :size="16" /></button>
          <span class="text-sm font-medium text-[var(--color-text)] min-w-36 text-center capitalize">{{ planner.monthLabel }}</span>
          <button @click="planner.nextMonth()" class="btn-secondary p-1.5"><ChevronRight :size="16" /></button>
          <button @click="planner.goToCurrentMonth()" class="btn-secondary text-xs">Hoy</button>
        </template>

        <button @click="showSchedule = true" class="btn-secondary text-xs flex items-center gap-1">
          <Clock :size="13" />
          Horario
        </button>
      </div>
    </div>

    <!-- Week view -->
    <div v-if="viewMode === 'week'" class="flex gap-4 overflow-x-auto pb-4">
      <UnassignedPanel
        :subject-ids="subjectIds"
        @assign="planner.fetchWeek()"
        @move-to-today="moveToToday"
      />
      <div class="flex gap-2 flex-1 min-w-0">
        <WeekColumn
          v-for="day in planner.weekDays"
          :key="format(day, 'yyyy-MM-dd')"
          :day="day"
          :topics="planner.topicsForDay(day, 'week')"
          :subjects="subjectMap"
          :available-hours="availableHoursForDay(day)"
          @drop="(topicId, subjectId) => planner.assignTopicToDay(topicId, subjectId, day)"
          @remove="(topicId, subjectId) => planner.assignTopicToDay(topicId, subjectId, null)"
          @click-day="selectedDay = day"
        />
      </div>
    </div>

    <!-- Month view -->
    <div v-else class="flex gap-4">
      <div class="w-48 shrink-0">
        <UnassignedPanel
          :subject-ids="subjectIds"
          compact
          @assign="planner.fetchMonth()"
          @move-to-today="moveToToday"
        />
      </div>
      <div class="flex-1 min-w-0">
        <PlannerMonthView :subjects="subjectMap" />
      </div>
    </div>

    <!-- Day panel (Option A) -->
    <DayPanel
      :open="selectedDay !== null"
      :day="selectedDay"
      :topics="selectedDayTopics"
      :subjects="subjectMap"
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
          <WeeklyScheduleEditor v-model="editSchedule" />
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
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-vue-next'
import { usePlannerStore } from '@/stores/planner'
import { useSubjectStore } from '@/stores/subject'
import { useSemesterStore } from '@/stores/semester'
import type { WeeklySchedule } from '@/types'
import { parseSchedule } from '@/stores/semester'
import WeekColumn from '@/components/planner/WeekColumn.vue'
import UnassignedPanel from '@/components/planner/UnassignedPanel.vue'
import PlannerMonthView from '@/components/planner/PlannerMonthView.vue'
import DayPanel from '@/components/planner/DayPanel.vue'
import WeeklyScheduleEditor from '@/components/semesters/WeeklyScheduleEditor.vue'

const planner = usePlannerStore()
const subjectStore = useSubjectStore()
const semesterStore = useSemesterStore()

const viewMode = ref<'week' | 'month'>('week')
const selectedDay = ref<Date | null>(null)
const subjectIds = computed(() => subjectStore.subjects.map((s) => s.$id))
const subjectMap = computed(() => Object.fromEntries(subjectStore.subjects.map((s) => [s.$id, s])))

const selectedDayTopics = computed(() =>
  selectedDay.value ? planner.topicsForDay(selectedDay.value, 'week') : []
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
  await semesterStore.fetchAll()
  await subjectStore.fetchActive()
  await planner.fetchWeek()
  await planner.fetchOverdue()
})
</script>
