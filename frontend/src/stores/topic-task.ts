import { defineStore } from 'pinia'
import { ref } from 'vue'
import { topicTaskCol } from '@/lib/collections'
import type { TopicTask } from '@/types'

export const TASK_TEMPLATE = [
  'Leer el tema',
  'Subrayar y tomar notas',
  'Elaborar esquema o mapa conceptual',
  'Responder preguntas de autoevaluación',
  'Hacer ejercicios prácticos',
  'Repasar y consolidar',
]

export const useTopicTaskStore = defineStore('topic-task', () => {
  // tasks indexed by topic_id
  const tasksByTopic = ref<Record<string, TopicTask[]>>({})

  async function fetchByTopic(topicId: string) {
    const tasks = await topicTaskCol.listByTopic(topicId)
    tasksByTopic.value[topicId] = tasks
  }

  function getByTopic(topicId: string): TopicTask[] {
    return tasksByTopic.value[topicId] ?? []
  }

  async function createFromTemplate(topicId: string, userId: string) {
    const created = await Promise.all(
      TASK_TEMPLATE.map((title, i) =>
        topicTaskCol.create({ topic_id: topicId, user_id: userId, title, done: false, order: i })
      )
    )
    tasksByTopic.value[topicId] = created.sort((a, b) => a.order - b.order)
  }

  async function addTask(topicId: string, userId: string, title: string) {
    const existing = tasksByTopic.value[topicId] ?? []
    const order = existing.length
    const task = await topicTaskCol.create({ topic_id: topicId, user_id: userId, title, done: false, order })
    tasksByTopic.value[topicId] = [...existing, task]
  }

  async function toggleDone(task: TopicTask) {
    const updated = await topicTaskCol.update(task.$id, { done: !task.done })
    const list = tasksByTopic.value[task.topic_id]
    if (list) {
      const idx = list.findIndex((t) => t.$id === task.$id)
      if (idx !== -1) list[idx] = updated
    }
  }

  async function reorder(topicId: string, fromIndex: number, toIndex: number) {
    const list = [...(tasksByTopic.value[topicId] ?? [])]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    // Assign new order values
    const updated = list.map((t, i) => ({ ...t, order: i }))
    tasksByTopic.value[topicId] = updated
    // Persist only the moved items whose order changed
    await Promise.all(
      updated.map((t) => topicTaskCol.update(t.$id, { order: t.order }))
    )
  }

  async function remove(task: TopicTask) {
    await topicTaskCol.delete(task.$id)
    const list = tasksByTopic.value[task.topic_id]
    if (list) {
      tasksByTopic.value[task.topic_id] = list.filter((t) => t.$id !== task.$id)
    }
  }

  async function renameTask(task: TopicTask, title: string) {
    const updated = await topicTaskCol.update(task.$id, { title })
    const list = tasksByTopic.value[task.topic_id]
    if (list) {
      const idx = list.findIndex((t) => t.$id === task.$id)
      if (idx !== -1) list[idx] = updated
    }
  }

  return { tasksByTopic, fetchByTopic, getByTopic, createFromTemplate, addTask, toggleDone, reorder, remove, renameTask }
})
