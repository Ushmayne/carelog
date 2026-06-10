'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActivityItem } from '@/types'

interface MedLogRow {
  id: string
  skipped: boolean
  administered_at: string
  notes: string | null
  skip_reason: string | null
  medication: { name: string } | null
  profile: { full_name: string | null } | null
}

interface VisitRow {
  id: string
  visit_date: string
  notes: string
  visitor: { full_name: string | null } | null
}

interface TaskRow {
  id: string
  title: string
  completed_at: string | null
  assignee: { full_name: string | null } | null
}

interface AppointmentRow {
  id: string
  title: string
  status: string
  appointment_date: string
  outcome: string | null
  creator: { full_name: string | null } | null
}

interface VitalRow {
  id: string
  type: string
  value: string
  unit: string
  recorded_at: string
  recorder: { full_name: string | null } | null
}

export async function getActivityFeed(careGroupId: string, limit = 50): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const [logsRes, visitsRes, tasksRes, apptsRes, vitalsRes] = await Promise.all([
    supabase
      .from('medication_logs')
      .select('id, skipped, administered_at, notes, skip_reason, medication:medications(name), profile:profiles(full_name)')
      .eq('care_group_id', careGroupId)
      .order('administered_at', { ascending: false })
      .limit(30),
    supabase
      .from('visit_notes')
      .select('id, visit_date, notes, visitor:profiles(full_name)')
      .eq('care_group_id', careGroupId)
      .order('visit_date', { ascending: false })
      .limit(20),
    supabase
      .from('tasks')
      .select('id, title, completed_at, assignee:profiles!tasks_assigned_to_fkey(full_name)')
      .eq('care_group_id', careGroupId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('appointments')
      .select('id, title, status, appointment_date, outcome, creator:profiles(full_name)')
      .eq('care_group_id', careGroupId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .limit(15),
    supabase
      .from('vital_readings')
      .select('id, type, value, unit, recorded_at, recorder:profiles(full_name)')
      .eq('care_group_id', careGroupId)
      .order('recorded_at', { ascending: false })
      .limit(20),
  ])

  const items: ActivityItem[] = []

  for (const log of (logsRes.data ?? []) as unknown as MedLogRow[]) {
    items.push({
      id: log.id,
      type: log.skipped ? 'medication_skipped' : 'medication_given',
      title: log.skipped
        ? `${log.medication?.name ?? 'Medication'} dose skipped`
        : `${log.medication?.name ?? 'Medication'} dose given`,
      subtitle: [
        log.profile?.full_name,
        log.skip_reason ? `Reason: ${log.skip_reason}` : log.notes,
      ].filter(Boolean).join(' · '),
      timestamp: log.administered_at,
    })
  }

  for (const visit of (visitsRes.data ?? []) as unknown as VisitRow[]) {
    items.push({
      id: visit.id,
      type: 'visit',
      title: `${visit.visitor?.full_name ?? 'Someone'} logged a visit`,
      subtitle: visit.notes.length > 80 ? visit.notes.slice(0, 80) + '…' : visit.notes,
      timestamp: visit.visit_date,
    })
  }

  for (const task of (tasksRes.data ?? []) as unknown as TaskRow[]) {
    items.push({
      id: task.id,
      type: 'task_completed',
      title: `Task completed: ${task.title}`,
      subtitle: task.assignee?.full_name ?? '',
      timestamp: task.completed_at!,
    })
  }

  for (const appt of (apptsRes.data ?? []) as unknown as AppointmentRow[]) {
    items.push({
      id: appt.id,
      type: 'appointment_completed',
      title: `Appointment completed: ${appt.title}`,
      subtitle: [appt.creator?.full_name, appt.outcome].filter(Boolean).join(' · '),
      timestamp: appt.appointment_date,
    })
  }

  const labelMap: Record<string, string> = {
    blood_pressure: 'Blood pressure',
    heart_rate: 'Heart rate',
    weight: 'Weight',
    blood_sugar: 'Blood sugar',
    temperature: 'Temperature',
    oxygen_saturation: 'O₂ saturation',
  }

  for (const vital of (vitalsRes.data ?? []) as unknown as VitalRow[]) {
    items.push({
      id: vital.id,
      type: 'vital_recorded',
      title: `${labelMap[vital.type] ?? vital.type}: ${vital.value} ${vital.unit}`,
      subtitle: vital.recorder?.full_name ?? '',
      timestamp: vital.recorded_at,
    })
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}
