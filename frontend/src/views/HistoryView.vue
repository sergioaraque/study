<template>
  <div>
    <h1 class="text-xl font-semibold text-[var(--color-text)] mb-6">Historial de cuatrimestres</h1>

    <div v-if="semesterStore.loading" class="text-[var(--color-text-muted)] text-sm">Cargando…</div>

    <div v-else-if="!archivedSemesters.length" class="text-center py-16 text-[var(--color-text-muted)]">
      <History :size="40" class="mx-auto mb-3 opacity-40" />
      <p class="text-sm">No hay cuatrimestres archivados aún.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="semester in archivedSemesters"
        :key="semester.$id"
        class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors"
        @click="toggleSemester(semester.$id)"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-[var(--color-text)]">{{ semester.name }}</h3>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
              {{ formatDate(semester.start_date) }} – {{ formatDate(semester.end_date) }}
            </p>
          </div>
          <ChevronDown
            :size="16"
            class="text-[var(--color-text-muted)] transition-transform"
            :class="{ 'rotate-180': expanded.has(semester.$id) }"
          />
        </div>

        <!-- Expanded content -->
        <div v-if="expanded.has(semester.$id)" class="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div v-if="loadedSubjects[semester.$id]" class="space-y-3">
            <div v-if="!loadedSubjects[semester.$id]!.length" class="text-xs text-[var(--color-text-muted)] italic">
              Sin asignaturas registradas
            </div>
            <div
              v-for="subject in loadedSubjects[semester.$id]"
              :key="subject.$id"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-2">
                <SubjectStatusBadge :status="subject.status" />
                <span class="text-[var(--color-text)]">{{ subject.name }}</span>
                <span class="text-xs text-[var(--color-text-muted)]">({{ subject.credits }} ECTS)</span>
              </div>
              <span v-if="subject.grade_final !== undefined" class="font-medium text-[var(--color-text)]">
                {{ subject.grade_final }}
              </span>
            </div>
          </div>
          <div v-else class="text-xs text-[var(--color-text-muted)]">Cargando…</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { History, ChevronDown } from 'lucide-vue-next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSemesterStore } from '@/stores/semester'
import { subjectCol } from '@/lib/collections'
import SubjectStatusBadge from '@/components/subjects/SubjectStatusBadge.vue'
import type { Subject } from '@/types'

const semesterStore = useSemesterStore()
const expanded = ref(new Set<string>())
const loadedSubjects = ref<Record<string, Subject[] | undefined>>({})

const archivedSemesters = computed(() =>
  semesterStore.semesters.filter((s) => !s.is_active)
)

onMounted(() => semesterStore.fetchAll())

function formatDate(d: string) {
  return format(new Date(d), "MMM yyyy", { locale: es })
}

async function toggleSemester(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
    if (!loadedSubjects.value[id]) {
      loadedSubjects.value[id] = await subjectCol.listBySemester(id)
    }
  }
}
</script>
