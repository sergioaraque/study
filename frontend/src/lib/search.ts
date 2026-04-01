import MiniSearch from 'minisearch'
import type { Subject, Topic, Pec, TutoringSession } from '@/types'

export interface SearchResult {
  id: string
  type: 'subject' | 'topic' | 'pec' | 'tutoring'
  title: string
  subtitle?: string
  route: string
}

const miniSearch = new MiniSearch<SearchResult>({
  fields: ['title', 'subtitle'],
  storeFields: ['id', 'type', 'title', 'subtitle', 'route'],
  searchOptions: { fuzzy: 0.2, prefix: true },
})

let indexed = false

export function buildIndex(data: {
  subjects: Subject[]
  topics: Map<string, Topic[]>
  pecs: Map<string, Pec[]>
  tutoring: Map<string, TutoringSession[]>
}) {
  if (indexed) miniSearch.removeAll()

  const docs: SearchResult[] = []

  for (const s of data.subjects) {
    docs.push({ id: `subject-${s.$id}`, type: 'subject', title: s.name, subtitle: s.description, route: `/subjects/${s.$id}` })
  }

  for (const [, topics] of data.topics) {
    for (const t of topics) {
      const subject = data.subjects.find((s) => s.$id === t.subject_id)
      docs.push({ id: `topic-${t.$id}`, type: 'topic', title: `T${t.number} ${t.title}`, subtitle: subject?.name, route: `/subjects/${t.subject_id}` })
    }
  }

  for (const [, pecs] of data.pecs) {
    for (const p of pecs) {
      const subject = data.subjects.find((s) => s.$id === p.subject_id)
      docs.push({ id: `pec-${p.$id}`, type: 'pec', title: p.title, subtitle: subject?.name, route: `/subjects/${p.subject_id}` })
    }
  }

  for (const [, sessions] of data.tutoring) {
    for (const s of sessions) {
      const subject = data.subjects.find((sub) => sub.$id === s.subject_id)
      if (s.notes) {
        docs.push({ id: `tutoring-${s.$id}`, type: 'tutoring', title: s.notes.slice(0, 80), subtitle: subject?.name, route: `/subjects/${s.subject_id}` })
      }
    }
  }

  miniSearch.addAll(docs)
  indexed = true
}

export function search(query: string): SearchResult[] {
  if (!query.trim()) return []
  return miniSearch.search(query) as unknown as SearchResult[]
}
