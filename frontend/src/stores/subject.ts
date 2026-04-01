import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subjectCol } from '@/lib/collections'
import { useSemesterStore } from './semester'
import { useAuthStore } from './auth'
import type { Subject } from '@/types'

export const useSubjectStore = defineStore('subject', () => {
  const subjects = ref<Subject[]>([])          // active semester subjects
  const librarySubjects = ref<Subject[]>([])   // unlinked (semester_id = '')
  const loading = ref(false)

  async function fetchBySemester(semesterId: string) {
    loading.value = true
    try {
      subjects.value = await subjectCol.listBySemester(semesterId)
    } finally {
      loading.value = false
    }
  }

  async function fetchActive() {
    const semester = useSemesterStore().activeSemester
    if (semester) await fetchBySemester(semester.$id)
  }

  async function fetchLibrary() {
    librarySubjects.value = await subjectCol.listLibrary(useAuthStore().userId)
  }

  async function create(data: Omit<Subject, '$id' | '$createdAt' | '$updatedAt'>) {
    const subject = await subjectCol.create(data)
    if (!subject.semester_id) {
      librarySubjects.value = [...librarySubjects.value, subject].sort((a, b) => a.name.localeCompare(b.name))
    } else {
      subjects.value.push(subject)
      subjects.value.sort((a, b) => a.name.localeCompare(b.name))
    }
    return subject
  }

  async function update(id: string, data: Partial<Subject>) {
    const updated = await subjectCol.update(id, data)
    const idx = subjects.value.findIndex((s) => s.$id === id)
    if (idx !== -1) subjects.value[idx] = updated
    const libIdx = librarySubjects.value.findIndex((s) => s.$id === id)
    if (libIdx !== -1) librarySubjects.value[libIdx] = updated
    return updated
  }

  async function remove(id: string) {
    await subjectCol.delete(id)
    subjects.value = subjects.value.filter((s) => s.$id !== id)
    librarySubjects.value = librarySubjects.value.filter((s) => s.$id !== id)
  }

  /** Move a library subject into a semester */
  async function linkToSemester(id: string, semesterId: string) {
    const updated = await subjectCol.update(id, { semester_id: semesterId, status: 'activa' })
    librarySubjects.value = librarySubjects.value.filter((s) => s.$id !== id)
    if (semesterId === useSemesterStore().activeSemester?.$id) {
      subjects.value = [...subjects.value, updated].sort((a, b) => a.name.localeCompare(b.name))
    }
    return updated
  }

  /** Move a subject back to the library (semester_id = '') */
  async function moveToLibrary(id: string) {
    const updated = await subjectCol.update(id, { semester_id: '', status: 'pendiente' })
    subjects.value = subjects.value.filter((s) => s.$id !== id)
    librarySubjects.value = [...librarySubjects.value, updated].sort((a, b) => a.name.localeCompare(b.name))
    return updated
  }

  function getById(id: string) {
    return subjects.value.find((s) => s.$id === id)
      ?? librarySubjects.value.find((s) => s.$id === id)
      ?? null
  }

  return {
    subjects, librarySubjects, loading,
    fetchBySemester, fetchActive, fetchLibrary,
    create, update, remove,
    linkToSemester, moveToLibrary, getById,
  }
})
