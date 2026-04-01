import type { NotificationPayload } from '../types/index.js'

export function pecReminderPayload(pecTitle: string, subjectName: string, daysLeft: number): NotificationPayload {
  return {
    title: `PEC: ${pecTitle}`,
    body: daysLeft === 0
      ? `¡La entrega de ${subjectName} es hoy!`
      : `Quedan ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para entregar la PEC de ${subjectName}`,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    url: '/pecs',
    tag: `pec-reminder`,
  }
}

export function examReminderPayload(subjectName: string, convocatoria: number, daysLeft: number): NotificationPayload {
  return {
    title: `Examen: ${subjectName}`,
    body: daysLeft === 0
      ? `¡Tu examen de ${subjectName} (conv. ${convocatoria}) es hoy!`
      : `Quedan ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para el examen de ${subjectName} (conv. ${convocatoria})`,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    url: '/planner',
    tag: `exam-reminder`,
  }
}
