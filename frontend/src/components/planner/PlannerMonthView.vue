<template>
  <div>
    <!-- Day-of-week headers -->
    <div class="grid grid-cols-7 mb-1">
      <div
        v-for="d in DAY_NAMES"
        :key="d"
        class="text-center text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide py-1"
      >
        {{ d }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="day in planner.monthCalendarDays"
        :key="format(day, 'yyyy-MM-dd')"
        class="rounded-lg border transition-colors"
        :class="[
          compact ? 'min-h-16 p-1' : 'min-h-20 p-1.5',
          isCurrentMonth(day) ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-transparent border-transparent opacity-40',
          isToday(day) ? '!border-[var(--color-primary)]/50 !bg-[var(--color-primary)]/5' : '',
          isDragOver === format(day, 'yyyy-MM-dd') ? '!border-[var(--color-primary)] !bg-[var(--color-primary)]/10' : '',
        ]"
        @dragover.prevent="isDragOver = format(day, 'yyyy-MM-dd')"
        @dragleave="isDragOver = null"
        @drop.prevent="onDrop(day)"
      >
        <!-- Day number + hours -->
        <div class="flex items-center justify-between" :class="compact ? 'mb-0.5' : 'mb-1'">
          <span
            class="font-medium w-5 h-5 flex items-center justify-center rounded-full"
            :class="[
              compact ? 'text-[10px]' : 'text-xs',
              isToday(day) ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]',
            ]"
          >
            {{ format(day, 'd') }}
          </span>
          <span
            v-if="availableHours(day) > 0"
            :class="[compact ? 'text-[9px]' : 'text-[10px]', loadStateClass(day)]"
          >
            {{ plannedHours(day).toFixed(1) }}h/{{ availableHours(day).toFixed(1) }}h
          </span>
        </div>
        <div v-if="availableHours(day) > 0" class="h-1 rounded-full bg-[var(--color-border)] overflow-hidden" :class="compact ? 'mb-1' : 'mb-1.5'">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="loadBarClass(day)"
            :style="{ width: `${Math.min(loadRatio(day) * 100, 100)}%` }"
          />
        </div>

        <!-- Topics for this day -->
        <div class="space-y-0.5">
          <div
            v-for="topic in planner.topicsForDay(day, 'month')"
            :key="topic.$id"
            class="flex items-center gap-1 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity"
            :class="compact ? 'px-1 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'"
            :style="{ backgroundColor: subjectColor(topic.subject_id) + '22', color: subjectColor(topic.subject_id) }"
            draggable="true"
            @dragstart="onDragStart(topic)"
            :title="`T${topic.number} ${topic.title}`"
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ backgroundColor: subjectColor(topic.subject_id) }"
            />
            <span class="truncate">T{{ topic.number }} {{ topic.title }}</span>
            <button
              @click.stop="planner.assignTopicToDay(topic.$id, topic.subject_id, null)"
              class="ml-auto shrink-0 opacity-50 hover:opacity-100"
            >×</button>
          </div>
          <div
            v-for="session in planner.tutoringsForDay(day, 'month')"
            :key="session.$id"
            class="flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)]"
            :class="compact ? 'px-1 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'"
            :title="`Tutoría ${subjectName(session.subject_id)} ${format(new Date(session.date), 'HH:mm')}`"
          >
            <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--color-primary)]" />
            <span class="truncate">Tutoría {{ format(new Date(session.date), 'HH:mm') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { format, isToday, isSameMonth } from 'date-fns'
import { usePlannerStore } from '@/stores/planner'
import { useSemesterStore } from '@/stores/semester'
import { getISODay } from 'date-fns'
import type { Topic, WeeklySchedule } from '@/types'

const props = defineProps<{ subjects: Record<string, { name: string }>; compact?: boolean }>()

const planner = usePlannerStore()
const semesterStore = useSemesterStore()

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function isCurrentMonth(day: Date) {
  return isSameMonth(day, planner.currentMonth)
}

// ── Subject colors ────────────────────────────────────────────────────────────
const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#84cc16',
]

function subjectColor(subjectId: string): string {
  const keys = Object.keys(props.subjects)
  const idx = keys.indexOf(subjectId)
  return PALETTE[(idx >= 0 ? idx : Math.abs(hashStr(subjectId))) % PALETTE.length]
}

function subjectName(subjectId: string): string {
  return props.subjects[subjectId]?.name ?? 'Asignatura'
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ── Hours available/planned ───────────────────────────────────────────────────
const DAY_KEYS: Record<number, keyof WeeklySchedule> = {
  1: 'hours_mon', 2: 'hours_tue', 3: 'hours_wed',
  4: 'hours_thu', 5: 'hours_fri', 6: 'hours_sat', 7: 'hours_sun',
}

function availableHours(day: Date): number {
  const sch = semesterStore.activeSchedule
  return sch[DAY_KEYS[getISODay(day)]] ?? 0
}

function plannedHours(day: Date): number {
  return planner.topicsForDay(day, 'month').reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
}

function loadRatio(day: Date): number {
  const avail = availableHours(day)
  if (avail <= 0) return 0
  return plannedHours(day) / avail
}

function loadStateClass(day: Date): string {
  const ratio = loadRatio(day)
  if (ratio > 1) return 'text-[var(--color-error)]'
  if (ratio >= 0.85) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-text-muted)]'
}

function loadBarClass(day: Date): string {
  const ratio = loadRatio(day)
  if (ratio > 1) return 'bg-[var(--color-error)]'
  if (ratio >= 0.85) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-success)]'
}

// ── Drag & drop ───────────────────────────────────────────────────────────────
const isDragOver = ref<string | null>(null)
let draggingTopic: Topic | null = null

function onDragStart(topic: Topic) {
  draggingTopic = topic
}

async function onDrop(day: Date) {
  isDragOver.value = null
  if (!draggingTopic) return
  await planner.assignTopicToDay(draggingTopic.$id, draggingTopic.subject_id, day)
  draggingTopic = null
}
</script>
