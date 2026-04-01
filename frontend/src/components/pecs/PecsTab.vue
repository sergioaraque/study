<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-[var(--color-text)]">PECs</h2>
      <div class="flex items-center gap-2">
        <button v-if="pecs.length" @click="exportICS" class="btn-secondary flex items-center gap-1 text-xs">
          <CalendarDown :size="13" /> Exportar .ics
        </button>
        <button @click="showForm = true" class="btn-primary flex items-center gap-1">
          <Plus :size="14" /> Nueva PEC
        </button>
      </div>
    </div>

    <div v-if="!pecs.length" class="text-center py-10 text-[var(--color-text-muted)] text-sm">
      No hay PECs registradas.
    </div>

    <div v-else class="space-y-3">
      <PecItem
        v-for="pec in pecs"
        :key="pec.$id"
        :pec="pec"
        @edit="editPec(pec)"
        @delete="pecStore.remove(pec.$id, subject.$id)"
        @update-status="(s) => pecStore.update(pec.$id, subject.$id, { status: s })"
      />
    </div>

    <!-- Calculadora de nota mínima -->
    <GradeCalculator :subject="subject" class="mt-6" />

    <BaseSidepanel :open="showForm" @close="closeForm" title="PEC">
      <PecForm
        :pec="editingPec"
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
import { usePecStore } from '@/stores/pec'
import { generatePecsICS, downloadICS } from '@/lib/ics'
import PecItem from './PecItem.vue'
import PecForm from './PecForm.vue'
import GradeCalculator from '@/components/subjects/GradeCalculator.vue'
import BaseSidepanel from '@/components/ui/BaseSidepanel.vue'
import type { Pec, Subject } from '@/types'

const props = defineProps<{ subject: Subject }>()
const pecStore = usePecStore()

const showForm = ref(false)
const editingPec = ref<Pec | null>(null)
const pecs = computed(() => pecStore.pecsBySubject[props.subject.$id] ?? [])

onMounted(() => pecStore.fetchBySubject(props.subject.$id))

function editPec(pec: Pec) { editingPec.value = pec; showForm.value = true }
function closeForm() { showForm.value = false; editingPec.value = null }

function exportICS() {
  const ics = generatePecsICS(pecs.value, props.subject.name)
  if (ics) downloadICS(ics, `pecs-${props.subject.name.toLowerCase().replace(/\s+/g, '-')}.ics`)
}
</script>
