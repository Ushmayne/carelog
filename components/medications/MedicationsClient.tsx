'use client'

import { useState } from 'react'
import { createMedication, logMedication, toggleMedicationActive, deleteMedication } from '@/app/actions/medications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pill, Plus, Check, X, Loader2, MoreHorizontal, History } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
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
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(false)

  // Add medication form
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [instructions, setInstructions] = useState('')
  const [doctor, setDoctor] = useState('')

  // Log form
  const [logMedId, setLogMedId] = useState('')
  const [administeredAt, setAdministeredAt] = useState(new Date().toISOString().slice(0, 16))
  const [logNotes, setLogNotes] = useState('')
  const [skipped, setSkipped] = useState(false)
  const [skipReason, setSkipReason] = useState('')

  async function handleAddMed(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createMedication(careGroupId, { name, dosage, frequency, instructions: instructions || undefined, prescribing_doctor: doctor || undefined })
      toast.success('Medication added')
      setAddOpen(false)
      setName(''); setDosage(''); setFrequency(''); setInstructions(''); setDoctor('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
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
      setLogNotes(''); setSkipped(false); setSkipReason('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log dose')
    } finally {
      setLoading(false)
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

  async function handleDelete(id: string) {
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-blue-600" />
            Medications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{activeMeds.length} active medications</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <History className="h-4 w-4 mr-2" />
              Log Dose
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Medication Dose</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLog} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Medication</Label>
                  <Select value={logMedId} onValueChange={v => setLogMedId(v ?? '')} required>
                    <SelectTrigger><SelectValue placeholder="Select medication..." /></SelectTrigger>
                    <SelectContent>
                      {activeMeds.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} — {m.dosage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Button type="submit" disabled={loading || !logMedId} className="flex-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Log
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
              </DialogHeader>
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
                  <Label>Special Instructions <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea placeholder="e.g. Take with food, avoid grapefruit" value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Prescribing Doctor <span className="text-muted-foreground">(optional)</span></Label>
                  <Input placeholder="e.g. Dr. Smith" value={doctor} onChange={e => setDoctor(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
          <TabsTrigger value="history">Log History ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="medications">
          {medications.length === 0 ? (
            <EmptyCard icon={<Pill className="h-10 w-10 text-muted-foreground/40" />} text="No medications added yet" subtext="Add medications to start tracking doses" />
          ) : (
            <div className="space-y-3">
              {activeMeds.map(med => <MedCard key={med.id} med={med} onToggle={handleToggleActive} onDelete={handleDelete} />)}
              {inactiveMeds.length > 0 && (
                <>
                  <div className="text-sm text-muted-foreground font-medium pt-2">Inactive</div>
                  {inactiveMeds.map(med => <MedCard key={med.id} med={med} onToggle={handleToggleActive} onDelete={handleDelete} />)}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {logs.length === 0 ? (
            <EmptyCard icon={<History className="h-10 w-10 text-muted-foreground/40" />} text="No logs yet" subtext="Log a dose to see history here" />
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <Card key={log.id}>
                  <CardContent className="py-3 px-4 flex items-center gap-4">
                    <div className={`rounded-full p-1.5 ${log.skipped ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Pill className={`h-4 w-4 ${log.skipped ? 'text-red-500' : 'text-blue-600'}`} />
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
                        {format(parseISO(log.administered_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
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

function MedCard({ med, onToggle, onDelete }: {
  med: Medication
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className={med.active ? '' : 'opacity-60'}>
      <CardContent className="py-4 px-4 flex items-start gap-4">
        <div className={`rounded-lg p-2 flex-shrink-0 ${med.active ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <Pill className={`h-5 w-5 ${med.active ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{med.name}</span>
            <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
            {!med.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{med.frequency}</div>
          {med.instructions && <div className="text-xs text-muted-foreground mt-1">Note: {med.instructions}</div>}
          {med.prescribing_doctor && <div className="text-xs text-muted-foreground">Dr. {med.prescribing_doctor}</div>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggle(med.id, !med.active)}>
              {med.active ? <><X className="h-4 w-4 mr-2" />Deactivate</> : <><Check className="h-4 w-4 mr-2" />Activate</>}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(med.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
