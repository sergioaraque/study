<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm"
    @click.self="ui.searchOpen = false"
  >
    <div class="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Search :size="16" class="text-[var(--color-text-muted)] shrink-0" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Buscar temas, asignaturas, PECs…"
          class="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none"
          autofocus
          @keydown.escape="ui.searchOpen = false"
          @keydown.arrow-down.prevent="moveSelection(1)"
          @keydown.arrow-up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="selectCurrent"
        />
        <kbd class="text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded px-1.5 py-0.5">Esc</kbd>
      </div>

      <div class="max-h-96 overflow-y-auto p-2">
        <p v-if="!query" class="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          Escribe para buscar…
        </p>
        <p v-else-if="results.length === 0" class="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          Sin resultados para "{{ query }}"
        </p>
        <template v-else>
          <RouterLink
            v-for="(result, idx) in results"
            :key="result.id"
            :to="result.route"
            @click="ui.searchOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            :class="idx === selectedIdx ? 'bg-[var(--color-surface-2)]' : 'hover:bg-[var(--color-surface-2)]'"
          >
            <span class="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0 capitalize">
              {{ typeLabel(result.type) }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-[var(--color-text)] truncate">{{ result.title }}</p>
              <p v-if="result.subtitle" class="text-xs text-[var(--color-text-muted)] truncate">{{ result.subtitle }}</p>
            </div>
          </RouterLink>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useSubjectStore } from '@/stores/subject'
import { useTopicStore } from '@/stores/topic'
import { usePecStore } from '@/stores/pec'
import { useTutoringStore } from '@/stores/tutoring'
import { buildIndex, search } from '@/lib/search'

const ui = useUiStore()
const router = useRouter()
const subjectStore = useSubjectStore()
const topicStore = useTopicStore()
const pecStore = usePecStore()
const tutoringStore = useTutoringStore()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIdx = ref(0)

// Build search index whenever stores change
watch([() => subjectStore.subjects, () => topicStore.topicsBySubject], () => {
  buildIndex({
    subjects: subjectStore.subjects,
    topics: new Map(Object.entries(topicStore.topicsBySubject)),
    pecs: new Map(Object.entries(pecStore.pecsBySubject)),
    tutoring: new Map(Object.entries(tutoringStore.sessionsBySubject)),
  })
}, { immediate: true })

const results = computed(() => search(query.value).slice(0, 15))

watch(results, () => { selectedIdx.value = 0 })

function typeLabel(type: string) {
  return { subject: 'Asignatura', topic: 'Tema', pec: 'PEC', tutoring: 'Tutoría' }[type] ?? type
}

function moveSelection(dir: 1 | -1) {
  const len = results.value.length
  if (!len) return
  selectedIdx.value = (selectedIdx.value + dir + len) % len
}

function selectCurrent() {
  const r = results.value[selectedIdx.value]
  if (r) { router.push(r.route); ui.searchOpen = false }
}

onMounted(() => inputRef.value?.focus())
</script>
