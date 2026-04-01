<template>
  <div
    class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors group"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between mb-3 gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-[var(--color-text)] truncate text-sm">{{ subject.name }}</h3>
        <p v-if="subject.description" class="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
          {{ subject.description }}
        </p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          @click.stop="$emit('edit')"
          class="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity"
        >
          <Pencil :size="12" />
        </button>
        <SubjectStatusBadge :status="subject.status" />
      </div>
    </div>

    <div v-if="subject.status !== 'convalidada'" class="mt-3">
      <BaseProgressBar
        :current="completedCount"
        :total="topicCount"
        :show-label="true"
        label="Temas"
      />
    </div>

    <div class="flex items-center gap-3 mt-3 text-xs text-[var(--color-text-muted)]">
      <span>{{ subject.credits }} ECTS</span>
      <span v-if="subject.degree_year">· Año {{ subject.degree_year }}</span>
      <span v-if="subject.grade_final !== undefined" class="ml-auto font-medium text-[var(--color-text)]">
        Nota: {{ subject.grade_final }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import SubjectStatusBadge from './SubjectStatusBadge.vue'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'
import type { Subject } from '@/types'

defineProps<{
  subject: Subject
  topicCount: number
  completedCount: number
}>()
defineEmits<{ click: []; edit: [] }>()
</script>
