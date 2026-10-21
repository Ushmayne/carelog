import Link from 'next/link'
import { format, isAfter, parseISO } from 'date-fns'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserCareGroup } from '@/app/actions/care-group'
import { getMedications, getMedicationLogs } from '@/app/actions/medications'
import { getAppointments } from '@/app/actions/appointments'
import { getVisitNotes } from '@/app/actions/visits'
import { getTasks } from '@/app/actions/tasks'
import { getVitals } from '@/app/actions/vitals'
import { getProfile } from '@/app/actions/profile'
import { SetupGroup } from '@/components/onboarding/SetupGroup'
import { TodayHeader, TodayMedications, WriteNoteLink } from '@/components/today/TodayMedications'
import { TodayTasks } from '@/components/today/TodayTasks'
import { MoodLabel } from '@/components/visits/MoodLabel'
import { initials } from '@/lib/utils'
import type { Medication, MedicationLog, VisitNote, VitalReading } from '@/types'

export const metadata = { title: 'Today' }

const VITAL_LABELS: Record<VitalReading['type'], string> = {
  blood_pressure: 'Blood pressure',
  blood_sugar: 'Blood sugar',
  weight: 'Weight',
  heart_rate: 'Heart rate',
  oxygen_saturation: 'O₂ saturation',
  temperature: 'Temperature',
}
const VITAL_ORDER = Object.keys(VITAL_LABELS) as VitalReading['type'][]

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()
  if (!group) return <SetupGroup />

  const [medications, logs, appointments, visits, tasks, vitals, profile] = await Promise.all([
    getMedications(group.id),
    getMedicationLogs(group.id, 60),
    getAppointments(group.id),
    getVisitNotes(group.id),
    getTasks(group.id),
    getVitals(group.id),
    getProfile(),
  ])

  const recipient = Array.isArray(group.care_recipient) ? group.care_recipient[0] : group.care_recipient
  const recipientFirstName: string | undefined = recipient?.name?.split(' ')[0]

  const now = new Date()
  const nextAppt = appointments.find(a => a.status === 'upcoming' && isAfter(parseISO(a.appointment_date), now))
  const myTasks = tasks
    .filter(t => t.assigned_to === user?.id && (t.status === 'pending' || t.status === 'in_progress'))
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
  const vitalSeries = VITAL_ORDER
    .map(type => ({ type, readings: (vitals as VitalReading[]).filter(v => v.type === type) }))
    .filter(s => s.readings.length > 0)
    .slice(0, 3)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-6 md:px-10 md:py-9">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <TodayHeader
          firstName={profile?.full_name?.split(' ')[0]}
          recipientFirstName={recipientFirstName}
          medications={medications as Medication[]}
          logs={logs as MedicationLog[]}
          nextAppointment={nextAppt}
        />
        <div className="hidden flex-wrap gap-2.5 md:flex">
          <WriteNoteLink />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <TodayMedications
            careGroupId={group.id}
            medications={medications as Medication[]}
            logs={logs as MedicationLog[]}
          />
          <FamilyNotes visits={(visits as VisitNote[]).slice(0, 3)} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Next appointment" href="/appointments" linkLabel="All">
            {nextAppt ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3.5">
                  <span className="w-14 shrink-0 overflow-hidden rounded-xl border border-border text-center">
                    <span className="block bg-primary py-0.5 text-xs font-semibold text-primary-foreground">
                      {format(parseISO(nextAppt.appointment_date), 'EEE')}
                    </span>
                    <span className="block py-1 text-[22px] font-semibold tabular-nums">
                      {format(parseISO(nextAppt.appointment_date), 'd')}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-base font-semibold">{nextAppt.title}</span>
                    <span className="text-sm text-foreground/80">
                      {[nextAppt.doctor_name, format(parseISO(nextAppt.appointment_date), 'MMM d · h:mm a')].filter(Boolean).join(' · ')}
                    </span>
                    {nextAppt.location && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" /> {nextAppt.location}
                      </span>
                    )}
                  </span>
                </div>
                {nextAppt.notes && (
                  <p className="rounded-[10px] bg-muted px-3 py-2.5 text-sm text-foreground/80 line-clamp-3">{nextAppt.notes}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing booked.</p>
            )}
          </Panel>

          <Panel title="Your tasks" href="/tasks" linkLabel={tasks.length ? `All ${tasks.length}` : 'Tasks'}>
            <TodayTasks tasks={myTasks.slice(0, 4).map(t => ({ id: t.id, title: t.title, due_date: t.due_date }))} />
          </Panel>

          <Panel title="Latest vitals" href="/vitals" linkLabel="Trends">
            {vitalSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No readings yet.</p>
            ) : (
              <ul className="flex flex-col">
                {vitalSeries.map(({ type, readings }) => {
                  const latest = readings[0]
                  return (
                    <li key={type} className="grid grid-cols-[minmax(0,1fr)_84px] items-center gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-muted-foreground">
                          {VITAL_LABELS[type]} · {format(parseISO(latest.recorded_at), 'MMM d, h:mm a')}
                        </span>
                        <span className="text-xl font-semibold tracking-[-0.01em] tabular-nums">
                          {latest.value} <span className="text-sm font-medium text-muted-foreground">{latest.unit}</span>
                        </span>
                      </span>
                      <Sparkline values={readings.slice(0, 8).reverse().map(r => parseFloat(r.value))} />
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, href, linkLabel, children }: {
  title: string
  href: string
  linkLabel: string
  children: React.ReactNode
}) {
  const id = `panel-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold text-muted-foreground">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">{linkLabel}</Link>
      </div>
      {children}
    </section>
  )
}

function FamilyNotes({ visits }: { visits: VisitNote[] }) {
  return (
    <section aria-labelledby="family-notes" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h2 id="family-notes" className="text-lg font-semibold tracking-[-0.01em]">From the family</h2>
        <Link href="/visits" className="text-sm font-medium text-primary hover:underline">All notes</Link>
      </div>
      {visits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          After a visit or a call, a short note here tells everyone else how they’re doing.{' '}
          <Link href="/visits" className="font-medium text-primary hover:underline">Write the first one</Link>
        </div>
      ) : (
        visits.map(visit => (
          <article key={visit.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3.5 rounded-2xl border border-border bg-card px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden="true">
              {initials(visit.visitor?.full_name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold">{visit.visitor?.full_name?.split(' ')[0] ?? 'Someone'}</span>
                <span className="text-muted-foreground">visited {format(parseISO(visit.visit_date), 'MMM d')}</span>
                {visit.mood && <MoodLabel mood={visit.mood} />}
              </div>
              <p className="max-w-[62ch] whitespace-pre-line text-foreground/90 line-clamp-4">{visit.notes}</p>
            </div>
          </article>
        ))
      )}
    </section>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const pts = values.filter(v => Number.isFinite(v))
  if (pts.length < 2) return <span aria-hidden="true" />
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const w = 84
  const h = 28
  const coords = pts.map((v, i) => [2 + (i / (pts.length - 1)) * (w - 4), h - 4 - ((v - min) / range) * (h - 8)])
  const last = coords[coords.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[84px] text-primary" aria-hidden="true">
      <polyline
        points={coords.map(c => c.join(',')).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />
    </svg>
  )
}
