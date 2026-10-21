import { isSameDay, parseISO } from 'date-fns'
import type { Medication, MedicationLog } from '@/types'

export type DoseStatus = 'given' | 'skipped' | 'missed' | 'due' | 'later'

export interface DoseSlot {
  key: string
  medication: Medication
  time: Date
  status: DoseStatus
  log?: MedicationLog
}

export interface TodaySchedule {
  slots: DoseSlot[]
  given: number
  skipped: number
  missed: number
  remaining: number
  /** Active medications with no scheduled times; they can be logged but have no slot. */
  unscheduled: Medication[]
}

// A dose counts as "due" from 30 minutes before to 60 minutes after its time; after that it is missed.
const DUE_BEFORE_MS = 60 * 60 * 1000
const MISSED_AFTER_MS = 60 * 60 * 1000

/**
 * Lays today's scheduled doses out in time order and matches them to today's logs.
 * Logs are matched to a medication's slots in order (first log → first slot), the same
 * rule the Medications page uses, so both screens agree on what has been given.
 */
export function buildTodaySchedule(medications: Medication[], logs: MedicationLog[], now: Date): TodaySchedule {
  const active = medications.filter(m => m.active)
  const todayLogs = logs
    .filter(l => isSameDay(parseISO(l.administered_at), now))
    .sort((a, b) => a.administered_at.localeCompare(b.administered_at))

  const slots: DoseSlot[] = []
  for (const med of active) {
    const times = [...(med.scheduled_times ?? [])].sort()
    const medLogs = todayLogs.filter(l => l.medication_id === med.id)
    times.forEach((t, i) => {
      const [h, m] = t.split(':').map(Number)
      const time = new Date(now)
      time.setHours(h, m, 0, 0)
      const log = medLogs[i]
      let status: DoseStatus
      if (log) status = log.skipped ? 'skipped' : 'given'
      else if (now.getTime() - time.getTime() > MISSED_AFTER_MS) status = 'missed'
      else if (time.getTime() - now.getTime() <= DUE_BEFORE_MS) status = 'due'
      else status = 'later'
      slots.push({ key: `${med.id}-${t}`, medication: med, time, status, log })
    })
  }
  slots.sort((a, b) => a.time.getTime() - b.time.getTime() || a.medication.name.localeCompare(b.medication.name))

  const count = (s: DoseStatus) => slots.filter(x => x.status === s).length
  return {
    slots,
    given: count('given'),
    skipped: count('skipped'),
    missed: count('missed'),
    remaining: count('due') + count('later'),
    unscheduled: active.filter(m => !m.scheduled_times?.length),
  }
}

export function greeting(now: Date) {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
