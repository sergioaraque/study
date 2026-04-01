import type { Exam, Pec } from '@/types'

function icsDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, '')
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function vevent(uid: string, summary: string, dtstart: string, description = '', location = ''): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${escape(summary)}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtstart}`,
  ]
  if (description) lines.push(`DESCRIPTION:${escape(description)}`)
  if (location) lines.push(`LOCATION:${escape(location)}`)
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function generateExamsICS(exams: Exam[], subjectName: string): string {
  const events: string[] = []

  for (const exam of exams) {
    if (exam.convocatoria_1_date) {
      events.push(vevent(
        `exam-c1-${exam.$id}`,
        `Examen C1 — ${subjectName}`,
        icsDateOnly(exam.convocatoria_1_date),
        '',
        exam.convocatoria_1_location ?? '',
      ))
    }
    if (exam.convocatoria_2_date) {
      events.push(vevent(
        `exam-c2-${exam.$id}`,
        `Examen C2 — ${subjectName}`,
        icsDateOnly(exam.convocatoria_2_date),
        '',
        exam.convocatoria_2_location ?? '',
      ))
    }
  }

  return buildCalendar(events)
}

export function generatePecsICS(pecs: Pec[], subjectName: string): string {
  const events = pecs
    .filter((p) => p.due_date)
    .map((p) =>
      vevent(
        `pec-${p.$id}`,
        `PEC: ${p.title} — ${subjectName}`,
        icsDateOnly(p.due_date!),
        p.description ?? '',
      )
    )

  return buildCalendar(events)
}

function buildCalendar(events: string[]): string {
  if (!events.length) return ''
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNED Study Planner//ES',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
