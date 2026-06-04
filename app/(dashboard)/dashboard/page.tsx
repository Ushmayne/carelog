import { createClient } from '@/lib/supabase/server'
import { getUserCareGroup } from '@/app/actions/care-group'
import { getMedications, getMedicationLogs } from '@/app/actions/medications'
import { getAppointments } from '@/app/actions/appointments'
import { getVisitNotes } from '@/app/actions/visits'
import { getTasks } from '@/app/actions/tasks'
import { getLatestVitals } from '@/app/actions/vitals'
import { SetupGroup } from '@/components/onboarding/SetupGroup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, Calendar, ClipboardList, CheckSquare, Copy, Users, Activity, ShieldAlert } from 'lucide-react'
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns'
import Link from 'next/link'
import { CopyInviteCode } from '@/components/dashboard/CopyInviteCode'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()

  if (!group) {
    return <SetupGroup />
  }

  const [medications, recentLogs, appointments, visits, tasks, latestVitals] = await Promise.all([
    getMedications(group.id),
    getMedicationLogs(group.id, 5),
    getAppointments(group.id),
    getVisitNotes(group.id),
    getTasks(group.id),
    getLatestVitals(group.id),
  ])

  const now = new Date()
  const nextWeek = addDays(now, 7)
  const upcomingAppts = appointments.filter(a =>
    a.status === 'upcoming' && isAfter(parseISO(a.appointment_date), now)
  ).slice(0, 3)

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const myTasks = pendingTasks.filter(t => t.assigned_to === user?.id)
  const activeMeds = medications.filter(m => m.active)

  const recipient = group.care_recipient?.[0] ?? group.care_recipient

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/40 border border-teal-100/80 px-5 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-teal-600/70 mb-1">
              {format(now, 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {recipient ? `Caring for ${recipient.name}` : group.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/emergency/${group.invite_code}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Emergency Info
            </Link>
            <CopyInviteCode code={group.invite_code} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={<Pill className="h-5 w-5 text-teal-600" />}
          label="Active Medications"
          value={activeMeds.length}
          href="/medications"
          bg="bg-teal-50"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-emerald-600" />}
          label="Upcoming Appts"
          value={upcomingAppts.length}
          href="/appointments"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-purple-600" />}
          label="Visit Notes"
          value={visits.length}
          href="/visits"
          bg="bg-purple-50"
        />
        <StatCard
          icon={<CheckSquare className="h-5 w-5 text-orange-600" />}
          label="Pending Tasks"
          value={pendingTasks.length}
          href="/tasks"
          bg="bg-orange-50"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-rose-600" />}
          label="Vitals Tracked"
          value={Object.keys(latestVitals).length}
          href="/vitals"
          bg="bg-rose-50"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Upcoming Appointments
              </CardTitle>
              <Link href="/appointments" className="text-xs text-teal-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppts.length === 0 ? (
              <EmptyState text="No upcoming appointments" />
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map(appt => (
                  <div key={appt.id} className="flex items-start gap-3">
                    <div className="bg-emerald-50 rounded-lg p-2 flex-shrink-0">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{appt.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(appt.appointment_date), 'MMM d, h:mm a')}
                        {appt.doctor_name && ` · ${appt.doctor_name}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-orange-600" />
                My Tasks
              </CardTitle>
              <Link href="/tasks" className="text-xs text-teal-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <EmptyState text="No tasks assigned to you" />
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-3">
                    <PriorityDot priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      {task.due_date && (
                        <div className="text-xs text-muted-foreground">
                          Due {format(parseISO(task.due_date), 'MMM d')}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent medication logs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-600" />
                Recent Medication Logs
              </CardTitle>
              <Link href="/medications" className="text-xs text-teal-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <EmptyState text="No medication logs yet" />
            ) : (
              <div className="space-y-3">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 flex-shrink-0 ${log.skipped ? 'bg-red-50' : 'bg-teal-50'}`}>
                      <Pill className={`h-4 w-4 ${log.skipped ? 'text-red-500' : 'text-teal-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {log.medication?.name}
                        {log.skipped && <span className="ml-1 text-red-500 text-xs">(skipped)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.profile?.full_name} · {format(parseISO(log.administered_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent visits */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                Recent Visits
              </CardTitle>
              <Link href="/visits" className="text-xs text-teal-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <EmptyState text="No visit notes yet" />
            ) : (
              <div className="space-y-3">
                {visits.slice(0, 3).map(visit => (
                  <div key={visit.id} className="flex items-start gap-3">
                    <MoodDot mood={visit.mood} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{visit.visitor?.full_name ?? 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{visit.notes}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(visit.visit_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, href, bg }: {
  icon: React.ReactNode
  label: string
  value: number
  href: string
  bg: string
}) {
  return (
    <Link href={href} className="h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-6 pb-5">
          <div className={`inline-flex rounded-xl p-2.5 ${bg} mb-4`}>{icon}</div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground mt-1.5 leading-snug">{label}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-4">{text}</p>
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: 'bg-gray-400',
    medium: 'bg-teal-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  }
  return <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[priority] ?? 'bg-gray-400'}`} />
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    pending: { label: 'Pending', variant: 'outline' },
    in_progress: { label: 'In Progress', variant: 'secondary' },
    completed: { label: 'Done', variant: 'default' },
  }
  const c = config[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={c.variant} className="text-xs shrink-0">{c.label}</Badge>
}

function MoodDot({ mood }: { mood?: string | null }) {
  const emoji: Record<string, string> = { good: '😊', fair: '😐', poor: '😟' }
  return (
    <div className="bg-purple-50 rounded-lg p-2 flex-shrink-0 text-base leading-none">
      {mood ? emoji[mood] ?? '📝' : '📝'}
    </div>
  )
}
