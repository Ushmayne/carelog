'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { format, formatDistanceStrict, isToday, isTomorrow, parseISO, differenceInCalendarDays } from 'date-fns'
import { Check, X, Loader2, Plus, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { logMedication } from '@/app/actions/medications'
import { buildTodaySchedule, greeting, type DoseSlot, type TodaySchedule } from '@/lib/today'
import { cn } from '@/lib/utils'
import type { Medication, MedicationLog } from '@/types'

// Ticks once a minute. Returns null during server render so nothing time-based
// is rendered in the server's time zone and then swapped on hydration.
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000)
  return () => clearInterval(id)
}
const getMinute = () => Math.floor(Date.now() / 60_000)
const getServerMinute = () => null

function useNow() {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute)
  return minute === null ? null : new Date(minute * 60_000)
}

interface HeaderProps {
  firstName?: string
  recipientFirstName?: string
  medications: Medication[]
  logs: MedicationLog[]
  nextAppointment?: { title: string; doctor_name?: string; appointment_date: string }
}

export function TodayHeader({ firstName, recipientFirstName, medications, logs, nextAppointment }: HeaderProps) {
  const now = useNow()
  if (!now) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-5 w-40 rounded-md bg-muted" />
        <div className="h-10 w-72 max-w-full rounded-lg bg-muted" />
        <div className="h-6 w-[28rem] max-w-full rounded-md bg-muted" />
      </div>
    )
  }

  const schedule = buildTodaySchedule(medications, logs, now)
  return (
    <div className="flex max-w-2xl flex-col gap-1.5">
      <p className="text-sm text-muted-foreground">{format(now, 'EEEE, MMMM d')}</p>
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] md:text-[34px]">
        {greeting(now)}{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="mt-1 text-base text-foreground/80 md:text-[17px]">
        {summarize(schedule, recipientFirstName, nextAppointment, now)}
      </p>
    </div>
  )
}

function summarize(
  s: TodaySchedule,
  name = 'They',
  appt: HeaderProps['nextAppointment'],
  now: Date
) {
  const parts: string[] = []
  const total = s.slots.length
  if (total === 0) {
    parts.push('No medication times are set up yet.')
  } else if (s.given + s.skipped === total) {
    parts.push(`All ${total} of ${name}’s doses are logged for today.`)
  } else {
    parts.push(`${name} has had ${s.given} of ${total} doses today.`)
  }
  const firstMissed = s.slots.find(x => x.status === 'missed')
  if (firstMissed) {
    parts.push(`The ${format(firstMissed.time, 'h:mm a')} ${firstMissed.medication.name} hasn’t been logged yet.`)
  }
  if (appt) {
    const date = parseISO(appt.appointment_date)
    const days = differenceInCalendarDays(date, now)
    if (days >= 0 && days <= 7) {
      const when = isToday(date) ? `today at ${format(date, 'h:mm a')}` : isTomorrow(date) ? 'tomorrow' : `on ${format(date, 'EEEE')}`
      const who = appt.doctor_name ? `sees ${appt.doctor_name}` : `has ${appt.title.toLowerCase()}`
      parts.push(`${name} ${who} ${when}.`)
    }
  }
  return parts.join(' ')
}

interface TimelineProps {
  careGroupId: string
  medications: Medication[]
  logs: MedicationLog[]
}

export function TodayMedications({ careGroupId, medications, logs }: TimelineProps) {
  const now = useNow()
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function log(slot: DoseSlot, skipped: boolean) {
    setPending(slot.key)
    try {
      await logMedication(careGroupId, {
        medication_id: slot.medication.id,
        administered_at: new Date().toISOString(),
        skipped,
      })
      toast.success(`${slot.medication.name} logged as ${skipped ? 'skipped' : 'given'}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t log that dose. Please try again.')
    } finally {
      setPending(null)
    }
  }

  const schedule = now ? buildTodaySchedule(medications, logs, now) : null
  const nowIndex = schedule && now ? schedule.slots.findIndex(s => s.time > now) : -1

  return (
    <section aria-labelledby="today-meds" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="today-meds" className="text-lg font-semibold tracking-[-0.01em]">Today’s medications</h2>
          {schedule && schedule.slots.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {[
                `${schedule.given} given`,
                schedule.skipped && `${schedule.skipped} skipped`,
                schedule.missed && `${schedule.missed} not logged`,
                schedule.remaining && `${schedule.remaining} to go`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <Link href="/medications" className="shrink-0 pt-0.5 text-sm font-medium text-primary hover:underline">
          Full schedule
        </Link>
      </div>

      {!schedule ? (
        <div className="space-y-2 px-5 pb-5" aria-hidden="true">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted" />)}
        </div>
      ) : schedule.slots.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-border px-5 py-6">
          <p className="max-w-md text-sm text-muted-foreground">
            {medications.some(m => m.active)
              ? 'Add the times each medication is taken and today’s doses will line up here.'
              : 'Add the medications they take, with their times, and today’s doses will line up here.'}
          </p>
          <Link href="/medications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Plus className="size-4" /> Set up medications
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-1 px-5 pb-4" aria-hidden="true">
            {schedule.slots.map(s => (
              <span
                key={s.key}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  s.status === 'given' && 'bg-primary',
                  s.status === 'skipped' && 'bg-destructive/70',
                  s.status === 'missed' && 'bg-attention-strong',
                  (s.status === 'due' || s.status === 'later') && 'bg-muted'
                )}
              />
            ))}
          </div>
          <ul>
            {schedule.slots.map((slot, i) => (
              <DoseRow
                key={slot.key}
                slot={slot}
                now={now!}
                showNowBefore={i === nowIndex}
                pending={pending === slot.key}
                disabled={pending !== null}
                onLog={log}
              />
            ))}
            {nowIndex === -1 && <NowMarker now={now!} />}
          </ul>
        </>
      )}

      {schedule && schedule.unscheduled.length > 0 && (
        <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
          {schedule.unscheduled.length === 1
            ? `${schedule.unscheduled[0].name} has no set time.`
            : `${schedule.unscheduled.length} medications have no set time.`}{' '}
          <Link href="/medications" className="font-medium text-primary hover:underline">Log from Medications</Link>
        </p>
      )}
    </section>
  )
}

function NowMarker({ now }: { now: Date }) {
  return (
    <li className="flex h-8 items-center gap-3 border-t border-border px-5" aria-label={`Now, ${format(now, 'h:mm a')}`}>
      <span className="w-[72px] shrink-0 text-xs font-semibold text-primary md:w-20">Now · {format(now, 'h:mm')}</span>
      <span className="h-0.5 flex-1 rounded-full bg-primary" aria-hidden="true" />
    </li>
  )
}

function DoseRow({ slot, now, showNowBefore, pending, disabled, onLog }: {
  slot: DoseSlot
  now: Date
  showNowBefore: boolean
  pending: boolean
  disabled: boolean
  onLog: (slot: DoseSlot, skipped: boolean) => void
}) {
  const { medication: med, status, log } = slot
  const missed = status === 'missed'
  const loggedBy = log?.profile?.full_name?.split(' ')[0]

  return (
    <>
      {showNowBefore && <NowMarker now={now} />}
      <li
        className={cn(
          'grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t px-5 py-3.5 md:grid-cols-[80px_minmax(0,1fr)_auto]',
          missed ? 'border-attention-border bg-attention' : 'border-border'
        )}
      >
        <span
          className={cn(
            'text-sm tabular-nums',
            missed ? 'font-semibold text-attention-foreground' : status === 'given' || status === 'skipped' ? 'text-muted-foreground' : 'font-semibold'
          )}
        >
          {format(slot.time, 'h:mm a')}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{med.name} <span className="font-normal text-muted-foreground">{med.dosage}</span></span>
          <span className={cn('truncate text-sm', missed ? 'text-attention-foreground' : 'text-muted-foreground')}>
            {missed ? `Not logged · ${formatDistanceStrict(slot.time, now)} ago` : med.instructions || med.frequency}
          </span>
        </span>

        <span className="col-span-2 flex flex-wrap items-center gap-2 text-sm md:col-span-1 md:justify-end">
          {status === 'given' && log && (
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Check className="size-[18px] text-primary" strokeWidth={2.6} aria-hidden="true" />
              Given {format(parseISO(log.administered_at), 'h:mm')}{loggedBy ? ` · ${loggedBy}` : ''}
            </span>
          )}
          {status === 'skipped' && log && (
            <span className="flex items-center gap-1.5 text-urgent-foreground">
              <X className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
              Skipped{loggedBy ? ` · ${loggedBy}` : ''}
            </span>
          )}
          {status === 'later' && (
            <span className="text-muted-foreground">In {formatDistanceStrict(slot.time, now)}</span>
          )}
          {(missed || status === 'due') && (
            <>
              {status === 'due' && <span className="mr-1 text-foreground/80">{slot.time > now ? `Due in ${formatDistanceStrict(slot.time, now)}` : 'Due now'}</span>}
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onLog(slot, true)}
                className={cn(missed && 'border-attention-border bg-transparent text-attention-foreground hover:bg-attention-border/40')}
              >
                Skipped
              </Button>
              <Button
                size="sm"
                disabled={disabled}
                onClick={() => onLog(slot, false)}
                className={cn(missed && 'bg-foreground text-background hover:bg-foreground/90')}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Log as given
              </Button>
            </>
          )}
        </span>
      </li>
    </>
  )
}

export function WriteNoteLink() {
  return (
    <Link href="/visits" className={buttonVariants({ variant: 'outline' })}>
      <NotebookPen className="size-4" /> Write a note
    </Link>
  )
}
