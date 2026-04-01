<template>
  <div class="mt-3 space-y-1.5">
    <!-- Task items -->
    <div
      v-for="(task, index) in tasks"
      :key="task.$id"
      class="flex items-center gap-2 rounded-lg px-2 py-1.5 border transition-colors"
      :class="[
        dragOverIndex === index ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-transparent',
        task.done ? 'opacity-50' : '',
      ]"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent="dragOverIndex = index"
      @dragleave="dragOverIndex = null"
      @drop.prevent="onDrop(index)"
      @dragend="dragOverIndex = null"
    >
      <!-- Drag handle -->
      <GripVertical :size="12" class="text-[var(--color-text-muted)] shrink-0 cursor-grab active:cursor-grabbing" />

      <!-- Checkbox -->
      <button
        @click="taskStore.toggleDone(task)"
        class="shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
        :class="task.done
          ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
          : 'border-[var(--color-border)] hover:border-[var(--color-success)]'"
      >
        <Check v-if="task.done" :size="8" />
      </button>

      <!-- Title (editable inline) -->
      <span
        v-if="editingId !== task.$id"
        class="flex-1 text-xs text-[var(--color-text)] cursor-text select-none"
        :class="{ 'line-through': task.done }"
        @dblclick="startEdit(task)"
      >
        {{ task.title }}
      </span>
      <input
        v-else
        :ref="(el) => { if (el) editInputRef = el as HTMLInputElement }"
        v-model="editTitle"
        class="flex-1 text-xs bg-transparent border-b border-[var(--color-primary)] outline-none text-[var(--color-text)]"
        @keydown.enter="commitEdit(task)"
        @keydown.escape="editingId = null"
        @blur="commitEdit(task)"
      />

      <!-- Delete -->
      <button
        @click="taskStore.remove(task)"
        class="shrink-0 p-0.5 rounded text-transparent hover:text-[var(--color-danger)] transition-colors group-hover:text-[var(--color-text-muted)]"
      >
        <X :size="10" />
      </button>
    </div>

    <!-- Add task -->
    <div class="flex items-center gap-2 mt-2">
      <input
        v-model="newTitle"
        placeholder="Añadir tarea…"
        class="flex-1 text-xs bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-[var(--color-text)] py-0.5 placeholder:text-[var(--color-text-muted)]"
        @keydown.enter="addTask"
      />
      <button
        v-if="newTitle.trim()"
        @click="addTask"
        class="text-[var(--color-primary)] shrink-0"
      >
        <Plus :size="14" />
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="tasks.length" class="flex items-center gap-2 mt-2">
      <div class="flex-1 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          class="h-full rounded-full bg-[var(--color-success)] transition-all"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <span class="text-xs text-[var(--color-text-muted)] shrink-0">{{ doneCount }}/{{ tasks.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { Check, GripVertical, Plus, X } from 'lucide-vue-next'
import { useTopicTaskStore } from '@/stores/topic-task'
import type { TopicTask } from '@/types'

const props = defineProps<{ topicId: string; userId: string }>()

const taskStore = useTopicTaskStore()
const tasks = computed(() => taskStore.getByTopic(props.topicId))

const doneCount = computed(() => tasks.value.filter((t) => t.done).length)
const progress = computed(() => tasks.value.length ? Math.round((doneCount.value / tasks.value.length) * 100) : 0)

// Drag to reorder
const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragFromIndex.value = index
}

async function onDrop(toIndex: number) {
  if (dragFromIndex.value === null || dragFromIndex.value === toIndex) return
  await taskStore.reorder(props.topicId, dragFromIndex.value, toIndex)
  dragFromIndex.value = null
  dragOverIndex.value = null
}

// Inline edit
const editingId = ref<string | null>(null)
const editTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

function startEdit(task: TopicTask) {
  editingId.value = task.$id
  editTitle.value = task.title
  nextTick(() => editInputRef.value?.focus())
}

async function commitEdit(task: TopicTask) {
  if (editTitle.value.trim() && editTitle.value !== task.title) {
    await taskStore.renameTask(task, editTitle.value.trim())
  }
  editingId.value = null
}

// Add new
const newTitle = ref('')

async function addTask() {
  if (!newTitle.value.trim()) return
  await taskStore.addTask(props.topicId, props.userId, newTitle.value.trim())
  newTitle.value = ''
}

onMounted(() => taskStore.fetchByTopic(props.topicId))
</script>
