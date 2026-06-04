'use client'

import { useState } from 'react'
import { createMedication, logMedication, toggleMedicationActive, deleteMedication } from '@/app/actions/medications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pill, Plus, Check, X, Loader2, MoreHorizontal, History, Clock, AlertCircle, BarChart2,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import type { Medication, MedicationLog } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  careGroupId: string
  medications: Medication[]
  logs: MedicationLog[]
}

export function MedicationsClient({ careGroupId, medications, logs }: Props) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [logLoading, setLogLoading] = useState(false)

  // Add medication form
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [instructions, setInstructions] = useState('')
  const [doctor, setDoctor] = useState('')
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([])
  const [newTime, setNewTime] = useState('')

  // Log form
  const [logMedId, setLogMedId] = useState('')
  const [administeredAt, setAdministeredAt] = useState(new Date().toISOString().slice(0, 16))
  const [logNotes, setLogNotes] = useState('')
  const [skipped, setSkipped] = useState(false)
  const [skipReason, setSkipReason] = useState('')

  function openLogDialog(medId = '') {
    setLogMedId(medId)
    setAdministeredAt(new Date().toISOString().slice(0, 16))
    setLogNotes('')
    setSkipped(false)
    setSkipReason('')
    setLogOpen(true)
  }

  async function handleAddMed(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    try {
      await createMedication(careGroupId, {
        name, dosage, frequency,
        instructions: instructions || undefined,
        prescribing_doctor: doctor || undefined,
        scheduled_times: scheduledTimes.length > 0 ? scheduledTimes : undefined,
      })
      toast.success('Medication added')
      setAddOpen(false)
      setName(''); setDosage(''); setFrequency(''); setInstructions(''); setDoctor(''); setScheduledTimes([])
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add medication')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setLogLoading(true)
    try {
      await logMedication(careGroupId, {
        medication_id: logMedId,
        administered_at: new Date(administeredAt).toISOString(),
        notes: logNotes || undefined,
        skipped,
        skip_reason: skipReason || undefined,
      })
      toast.success(skipped ? 'Dose marked as skipped' : 'Dose logged')
      setLogOpen(false)
      setLogMedId('')
      setAdministeredAt(new Date().toISOString().slice(0, 16))
      setLogNotes(''); setSkipped(false); setSkipReason('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log dose')
    } finally {
      setLogLoading(false)
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await toggleMedicationActive(id, active)
      toast.success(active ? 'Medication activated' : 'Medication deactivated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  async function handleDelete(id: string, medName: string) {
    if (!window.confirm(`Delete "${medName}"? This cannot be undone.`)) return
    try {
      await deleteMedication(id)
      toast.success('Medication deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const activeMeds = medications.filter(m => m.active)
  const inactiveMeds = medications.filter(m => !m.active)

  // Group logs by date
  const logsByDate: Record<string, MedicationLog[]> = {}
  for (const log of logs) {
    const dateKey = format(parseISO(log.administered_at), 'yyyy-MM-dd')
    if (!logsByDate[dateKey]) logsByDate[dateKey] = []
    logsByDate[dateKey].push(log)
  }

  // Today's schedule data
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLogs = logs.filter(l => format(parseISO(l.administered_at), 'yyyy-MM-dd') === todayStr)
  const scheduledMeds = activeMeds.filter(m => m.scheduled_times && m.scheduled_times.length > 0)

  // Adherence stats (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentLogs = logs.filter(l => parseISO(l.administered_at) >= thirtyDaysAgo)
  const adherenceStats = activeMeds.map(med => {
    const medLogs = recentLogs.filter(l => l.medication_id === med.id)
    const given = medLogs.filter(l => !l.skipped).length
    const skippedCount = medLogs.filter(l => l.skipped).length
    const total = given + skippedCount
    const pct = total > 0 ? Math.round((given / total) * 100) : null
    return { med, given, skipped: skippedCount, total, pct }
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-teal-600" />
            Medications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{activeMeds.length} active medications</p>
        </div>
        <div className="flex gap-2">
          {/* Log dose dialog */}
          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <DialogTrigger render={<Button variant="outline" onClick={() => openLogDialog()} />}>
              <History className="h-4 w-4 mr-2" />Log Dose
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Medication Dose</DialogTitle></DialogHeader>
              <form onSubmit={handleLog} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Medication</Label>
                  {activeMeds.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No active medications. Add one first.</p>
                  ) : (
                    <Select value={logMedId} onValueChange={v => setLogMedId(v ?? '')} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication...">
                          {(value: string | null) => {
                            const med = activeMeds.find(m => m.id === value)
                            return med ? `${med.name} — ${med.dosage}` : 'Select medication...'
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeMeds.map(m => (
                          <SelectItem key={m.id} value={m.id} label={`${m.name} — ${m.dosage}`}>{m.name} — {m.dosage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={administeredAt} onChange={e => setAdministeredAt(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="skipped" checked={skipped} onChange={e => setSkipped(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="skipped">Dose was skipped</Label>
                </div>
                {skipped && (
                  <div className="space-y-2">
                    <Label>Skip Reason</Label>
                    <Input placeholder="e.g. Patient refused, ran out of medication" value={skipReason} onChange={e => setSkipReason(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea placeholder="Any observations..." value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={logLoading || !logMedId || activeMeds.length === 0} className="flex-1">
                    {logLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Log
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add medication dialog */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />Add Medication
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
              <form onSubmit={handleAddMed} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input placeholder="e.g. Lisinopril" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input placeholder="e.g. 10mg" value={dosage} onChange={e => setDosage(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Input placeholder="e.g. Once daily with breakfast" value={frequency} onChange={e => setFrequency(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>
                    Scheduled Times
                    <span className="text-muted-foreground font-normal"> (optional — for daily schedule tracking)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newTime && !scheduledTimes.includes(newTime)) {
                          setScheduledTimes(prev => [...prev, newTime].sort())
                          setNewTime('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {scheduledTimes.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {scheduledTimes.map(t => {
                        const [h, m] = t.split(':').map(Number)
                        const d = new Date(); d.setHours(h, m)
                        return (
                          <span key={t} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                            {format(d, 'h:mm a')}
                            <button type="button" onClick={() => setScheduledTimes(prev => prev.filter(x => x !== t))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Special Instructions <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea placeholder="e.g. Take with food, avoid grapefruit" value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Prescribing Doctor <span className="text-muted-foreground">(optional)</span></Label>
                  <Input placeholder="e.g. Dr. Smith" value={doctor} onChange={e => setDoctor(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={addLoading} className="flex-1">
                    {addLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Medication
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="medications">
        <TabsList className="mb-4">
          <TabsTrigger value="medications">Medications ({medications.length})</TabsTrigger>
          <TabsTrigger value="schedule">
            Today&apos;s Schedule
            {scheduledMeds.length > 0 && (
              <span className="ml-1.5 text-xs bg-teal-600 text-white rounded-full px-1.5">{scheduledMeds.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Log History ({logs.length})</TabsTrigger>
          <TabsTrigger value="stats">Adherence Stats</TabsTrigger>
        </TabsList>

        {/* ── Medications list ── */}
        <TabsContent value="medications">
          {medications.length === 0 ? (
            <EmptyCard icon={<Pill className="h-10 w-10 text-muted-foreground/40" />} text="No medications added yet" subtext="Add medications to start tracking doses" />
          ) : (
            <div className="space-y-3">
              {activeMeds.map(med => (
                <MedCard key={med.id} med={med} onToggle={handleToggleActive} onDelete={handleDelete} onLogDose={openLogDialog} />
              ))}
              {inactiveMeds.length > 0 && (
                <>
                  <div className="text-sm text-muted-foreground font-medium pt-2">Inactive</div>
                  {inactiveMeds.map(med => (
                    <MedCard key={med.id} med={med} onToggle={handleToggleActive} onDelete={handleDelete} onLogDose={openLogDialog} />
                  ))}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Today's schedule ── */}
        <TabsContent value="schedule">
          {scheduledMeds.length === 0 ? (
            <EmptyCard
              icon={<Clock className="h-10 w-10 text-muted-foreground/40" />}
              text="No scheduled times set"
              subtext="Add scheduled times to medications to use this view"
            />
          ) : (
            <div className="space-y-3">
              {scheduledMeds.map(med => {
                const medLogs = todayLogs.filter(l => l.medication_id === med.id)
                const givenCount = medLogs.filter(l => !l.skipped).length
                const scheduledCount = med.scheduled_times!.length
                const allGiven = givenCount >= scheduledCount
                const now = new Date()

                return (
                  <Card key={med.id}>
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{med.name}</span>
                            <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                            {allGiven && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">All done</span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap mb-3">
                            {med.scheduled_times!.map((t, i) => {
                              const [h, m] = t.split(':').map(Number)
                              const scheduledDate = new Date(); scheduledDate.setHours(h, m, 0, 0)
                              const isPast = scheduledDate < now
                              const isGiven = i < givenCount

                              let statusClass = 'bg-gray-100 text-gray-500'
                              let StatusIcon = Clock
                              if (isGiven) { statusClass = 'bg-green-100 text-green-700'; StatusIcon = Check }
                              else if (isPast) { statusClass = 'bg-red-100 text-red-600'; StatusIcon = AlertCircle }

                              return (
                                <span key={t} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {format(scheduledDate, 'h:mm a')}
                                </span>
                              )
                            })}
                          </div>
                          <Progress
                            value={scheduledCount > 0 ? (givenCount / scheduledCount) * 100 : 0}
                            className="h-1.5"
                          />
                          <div className="text-xs text-muted-foreground mt-1">{givenCount} of {scheduledCount} doses given today</div>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => openLogDialog(med.id)}>
                          Log Dose
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {activeMeds.filter(m => !m.scheduled_times?.length).length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {activeMeds.filter(m => !m.scheduled_times?.length).length} active medication(s) have no scheduled times
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Log history ── */}
        <TabsContent value="history">
          {logs.length === 0 ? (
            <EmptyCard icon={<History className="h-10 w-10 text-muted-foreground/40" />} text="No logs yet" subtext="Log a dose to see history here" />
          ) : (
            <div className="space-y-4">
              {Object.entries(logsByDate).map(([dateKey, dateLogs]) => (
                <div key={dateKey}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {format(parseISO(dateKey), 'EEEE, MMMM d')}
                  </div>
                  <div className="space-y-2">
                    {dateLogs.map(log => (
                      <Card key={log.id}>
                        <CardContent className="py-3 px-4 flex items-center gap-4">
                          <div className={`rounded-full p-1.5 ${log.skipped ? 'bg-red-100' : 'bg-teal-100'}`}>
                            <Pill className={`h-4 w-4 ${log.skipped ? 'text-red-500' : 'text-teal-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{log.medication?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.medication?.dosage} · by {log.profile?.full_name}
                              {log.notes && ` · ${log.notes}`}
                              {log.skip_reason && ` · Reason: ${log.skip_reason}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {log.skipped ? (
                              <Badge variant="destructive" className="text-xs">Skipped</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Given</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(log.administered_at), 'h:mm a')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Adherence stats ── */}
        <TabsContent value="stats">
          <div className="mb-3 text-sm text-muted-foreground">Last 30 days · active medications only</div>
          {activeMeds.length === 0 ? (
            <EmptyCard icon={<BarChart2 className="h-10 w-10 text-muted-foreground/40" />} text="No active medications" subtext="Add medications to track adherence" />
          ) : (
            <div className="space-y-3">
              {adherenceStats.map(({ med, given, skipped: sk, total, pct }) => (
                <Card key={med.id}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold">{med.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{med.dosage}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        pct === null ? 'text-muted-foreground' :
                        pct >= 80 ? 'text-green-600' :
                        pct >= 50 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {pct !== null ? `${pct}%` : 'No data'}
                      </span>
                    </div>
                    {total > 0 && (
                      <>
                        <Progress value={pct ?? 0} className="h-2 mb-1" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="text-green-600">{given} given</span>
                          <span>{total} total doses</span>
                          {sk > 0 && <span className="text-red-500">{sk} skipped</span>}
                        </div>
                      </>
                    )}
                    {total === 0 && (
                      <p className="text-xs text-muted-foreground">No logs in the last 30 days</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MedCard({ med, onToggle, onDelete, onLogDose }: {
  med: Medication
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string, name: string) => void
  onLogDose: (medId: string) => void
}) {
  return (
    <Card className={med.active ? '' : 'opacity-60'}>
      <CardContent className="py-4 px-4 flex items-start gap-4">
        <div className={`rounded-lg p-2 flex-shrink-0 ${med.active ? 'bg-teal-50' : 'bg-gray-50'}`}>
          <Pill className={`h-5 w-5 ${med.active ? 'text-teal-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{med.name}</span>
            <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
            {!med.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{med.frequency}</div>
          {med.scheduled_times && med.scheduled_times.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {med.scheduled_times.map(t => {
                const [h, m] = t.split(':').map(Number)
                const d = new Date(); d.setHours(h, m)
                return (
                  <span key={t} className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />{format(d, 'h:mm a')}
                  </span>
                )
              })}
            </div>
          )}
          {med.instructions && <div className="text-xs text-muted-foreground mt-1">Note: {med.instructions}</div>}
          {med.prescribing_doctor && <div className="text-xs text-muted-foreground">Dr. {med.prescribing_doctor}</div>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {med.active && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onLogDose(med.id)}>
              Log Dose
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggle(med.id, !med.active)}>
                {med.active ? <><X className="h-4 w-4 mr-2" />Deactivate</> : <><Check className="h-4 w-4 mr-2" />Activate</>}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(med.id, med.name)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyCard({ icon, text, subtext }: { icon: React.ReactNode; text: string; subtext: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
        {icon}
        <div className="font-medium text-muted-foreground">{text}</div>
        <div className="text-sm text-muted-foreground/70">{subtext}</div>
      </CardContent>
    </Card>
  )
}
