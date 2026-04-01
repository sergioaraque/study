<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
    <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3">Progreso por asignatura</h3>

    <div v-if="!activeSubjects.length" class="text-xs text-[var(--color-text-muted)] italic">
      No hay asignaturas activas
    </div>

    <div v-else class="space-y-3">
      <div v-for="subject in activeSubjects" :key="subject.$id">
        <div class="flex items-center justify-between mb-1 text-xs">
          <span class="text-[var(--color-text)] truncate flex-1">{{ subject.name }}</span>
          <span class="text-[var(--color-text-muted)] shrink-0 ml-2">
            {{ completedFor(subject.$id) }}/{{ totalFor(subject.$id) }}
          </span>
        </div>
        <BaseProgressBar
          :current="completedFor(subject.$id)"
          :total="totalFor(subject.$id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import { useTopicStore } from '@/stores/topic'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'

const subjectStore = useSubjectStore()
const topicStore = useTopicStore()

const activeSubjects = computed(() =>
  subjectStore.subjects.filter((s) => s.status !== 'convalidada')
)

function totalFor(subjectId: string) {
  return topicStore.getBySubject(subjectId).length
}

function completedFor(subjectId: string) {
  return topicStore.getBySubject(subjectId).filter((t) => t.status === 'completado').length
}
</script>
