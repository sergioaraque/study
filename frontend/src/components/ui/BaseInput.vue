<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
      {{ label }} <span v-if="required" class="text-[var(--color-danger)]">*</span>
    </label>
    <div ref="pickerWrapRef" class="relative group">
      <input
        ref="inputRef"
        v-bind="$attrs"
        :value="modelValue"
        :required="required"
        :placeholder="placeholder"
        :type="type"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition-all"
        :class="{ 'pr-10': isDateLike }"
      />
      <button
        v-if="isDateLike"
        type="button"
        class="absolute inset-y-0 right-0 w-9 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        @click="togglePanel"
        aria-label="Abrir selector de fecha y hora"
      >
        <Clock3 v-if="type === 'time'" :size="14" />
        <CalendarDays v-else :size="14" />
      </button>

      <Transition name="picker-pop">
        <div
          v-if="showPanel"
          class="absolute z-30 right-0 mt-2 w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-3 space-y-3"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-[var(--color-text)]">{{ panelTitle }}</p>
            <button
              type="button"
              class="text-[10px] px-2 py-0.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              @click="clearValue"
            >
              Limpiar
            </button>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-if="type === 'date' || type === 'datetime-local'"
              type="button"
              class="text-[10px] px-2 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              @click="setToday"
            >
              Hoy
            </button>
            <button
              v-if="type === 'date' || type === 'datetime-local'"
              type="button"
              class="text-[10px] px-2 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              @click="setTomorrow"
            >
              Mañana
            </button>
            <button
              v-if="type === 'time' || type === 'datetime-local'"
              type="button"
              class="text-[10px] px-2 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              @click="setNow"
            >
              Ahora
            </button>
          </div>

          <div class="space-y-2">
            <div v-if="type === 'date' || type === 'datetime-local'">
              <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
                <div class="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    class="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                    @click="prevMonth"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft :size="14" />
                  </button>
                  <p class="text-xs font-semibold text-[var(--color-text)] capitalize">{{ monthLabel }}</p>
                  <button
                    type="button"
                    class="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                    @click="nextMonth"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight :size="14" />
                  </button>
                </div>

                <div class="grid grid-cols-7 gap-1 mb-1">
                  <span
                    v-for="dayName in weekdayNames"
                    :key="dayName"
                    class="text-[10px] text-center text-[var(--color-text-muted)] font-medium"
                  >
                    {{ dayName }}
                  </span>
                </div>

                <div class="grid grid-cols-7 gap-1">
                  <button
                    v-for="day in calendarDays"
                    :key="toLocalDate(day)"
                    type="button"
                    class="h-8 rounded-md text-xs transition-colors"
                    :class="dayClass(day)"
                    @click="selectCalendarDay(day)"
                  >
                    {{ day.getDate() }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="type === 'time' || type === 'datetime-local'">
              <label class="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">Hora</label>
              <input
                v-model="tempTime"
                type="time"
                class="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="text-xs px-2.5 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              @click="showPanel = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="text-xs px-2.5 py-1.5 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90"
              @click="applyValue"
            >
              Aplicar
            </button>
          </div>
        </div>
      </Transition>
    </div>
    <p v-if="error" class="text-xs text-[var(--color-danger)] mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
}>(), { type: 'text' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
defineOptions({ inheritAttrs: false })

const inputRef = ref<HTMLInputElement | null>(null)
const pickerWrapRef = ref<HTMLElement | null>(null)
const showPanel = ref(false)
const tempDate = ref('')
const tempTime = ref('')
const viewMonthStart = ref(startOfMonth(new Date()))
const weekdayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const isDateLike = computed(() => ['date', 'datetime-local', 'time'].includes(props.type ?? 'text'))
const panelTitle = computed(() => {
  if (props.type === 'date') return 'Seleccionar fecha'
  if (props.type === 'time') return 'Seleccionar hora'
  return 'Seleccionar fecha y hora'
})
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(viewMonthStart.value)
)
const calendarDays = computed(() => {
  const first = startOfMonth(viewMonthStart.value)
  const monthStartPad = (first.getDay() + 6) % 7
  const gridStart = addDays(first, -monthStartPad)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
})

function modelAsString(): string {
  if (props.modelValue == null) return ''
  return String(props.modelValue)
}

function toLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function syncTempFromModel() {
  const value = modelAsString()
  if (!value) {
    tempDate.value = ''
    tempTime.value = ''
    viewMonthStart.value = startOfMonth(new Date())
    return
  }

  if (props.type === 'date') {
    tempDate.value = value.slice(0, 10)
    viewMonthStart.value = startOfMonth(parseDatePart(tempDate.value) ?? new Date())
    return
  }

  if (props.type === 'time') {
    tempTime.value = value.slice(0, 5)
    return
  }

  const split = value.split('T')
  tempDate.value = split[0]?.slice(0, 10) ?? ''
  tempTime.value = split[1]?.slice(0, 5) ?? ''
  viewMonthStart.value = startOfMonth(parseDatePart(tempDate.value) ?? new Date())
}

function togglePanel() {
  if (!isDateLike.value) return
  if (!showPanel.value) syncTempFromModel()
  showPanel.value = !showPanel.value
}

function applyValue() {
  if (props.type === 'date') {
    emit('update:modelValue', tempDate.value)
    showPanel.value = false
    return
  }

  if (props.type === 'time') {
    emit('update:modelValue', tempTime.value)
    showPanel.value = false
    return
  }

  if (!tempDate.value) {
    emit('update:modelValue', '')
    showPanel.value = false
    return
  }

  emit('update:modelValue', `${tempDate.value}T${tempTime.value || '00:00'}`)
  showPanel.value = false
}

function clearValue() {
  tempDate.value = ''
  tempTime.value = ''
  emit('update:modelValue', '')
  showPanel.value = false
}

function setToday() {
  tempDate.value = toLocalDate(new Date())
  viewMonthStart.value = startOfMonth(new Date())
}

function setTomorrow() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  tempDate.value = toLocalDate(now)
  viewMonthStart.value = startOfMonth(now)
}

function setNow() {
  tempTime.value = toLocalTime(new Date())
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parseDatePart(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map((v) => Number(v))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function prevMonth() {
  viewMonthStart.value = new Date(viewMonthStart.value.getFullYear(), viewMonthStart.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewMonthStart.value = new Date(viewMonthStart.value.getFullYear(), viewMonthStart.value.getMonth() + 1, 1)
}

function isCurrentMonth(day: Date): boolean {
  return day.getMonth() === viewMonthStart.value.getMonth() && day.getFullYear() === viewMonthStart.value.getFullYear()
}

function isToday(day: Date): boolean {
  const now = new Date()
  return day.getDate() === now.getDate() && day.getMonth() === now.getMonth() && day.getFullYear() === now.getFullYear()
}

function isSelectedDay(day: Date): boolean {
  return tempDate.value === toLocalDate(day)
}

function dayClass(day: Date): string {
  if (isSelectedDay(day)) {
    return 'bg-[var(--color-primary)] text-white font-semibold'
  }
  if (!isCurrentMonth(day)) {
    return 'text-[var(--color-text-muted)]/60 hover:bg-[var(--color-surface)]'
  }
  if (isToday(day)) {
    return 'text-[var(--color-primary)] font-semibold bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15'
  }
  return 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
}

function selectCalendarDay(day: Date) {
  tempDate.value = toLocalDate(day)
}

function handleDocumentClick(event: MouseEvent) {
  if (!showPanel.value) return
  const target = event.target as Node | null
  if (!target || !pickerWrapRef.value) return
  if (!pickerWrapRef.value.contains(target)) {
    showPanel.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') showPanel.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='datetime-local']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 2.25rem;
  cursor: pointer;
}

.picker-pop-enter-active,
.picker-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.picker-pop-enter-from,
.picker-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
