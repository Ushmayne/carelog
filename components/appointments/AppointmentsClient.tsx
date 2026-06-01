'use client'

import { useState } from 'react'
import { createAppointment, updateAppointmentStatus, deleteAppointment } from '@/app/actions/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, MapPin, User, Loader2, MoreHorizontal, Check, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format, parseISO, isAfter } from 'date-fns'
import type { Appointment } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  careGroupId: string
  appointments: Appointment[]
}

export function AppointmentsClient({ careGroupId, appointments }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [outcomeDialog, setOutcomeDialog] = useState<Appointment | null>(null)
  const [outcome, setOutcome] = useState('')

  const [title, setTitle] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [location, setLocation] = useState('')
  const [apptDate, setApptDate] = useState('')
  const [notes, setNotes] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createAppointment(careGroupId, {
        title, doctor_name: doctorName || undefined,
        location: location || undefined,
        appointment_date: new Date(apptDate).toISOString(),
        notes: notes || undefined,
      })
      toast.success('Appointment added')
      setOpen(false)
      setTitle(''); setDoctorName(''); setLocation(''); setApptDate(''); setNotes('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add appointment')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(appt: Appointment) {
    setOutcomeDialog(appt)
    setOutcome('')
  }

  async function submitOutcome() {
    if (!outcomeDialog) return
    setLoading(true)
    try {
      await updateAppointmentStatus(outcomeDialog.id, 'completed', outcome || undefined)
      toast.success('Appointment marked as completed')
      setOutcomeDialog(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await updateAppointmentStatus(id, 'cancelled')
      toast.success('Appointment cancelled')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAppointment(id)
      toast.success('Appointment deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const now = new Date()
  const upcoming = appointments.filter(a => a.status === 'upcoming').sort((a, b) =>
    parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime()
  )
  const past = appointments.filter(a => a.status !== 'upcoming').sort((a, b) =>
    parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime()
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{upcoming.length} upcoming</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Add Appointment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Cardiology Follow-up" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Doctor <span className="text-muted-foreground">(optional)</span></Label>
                  <Input placeholder="Dr. Patel" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={apptDate} onChange={e => setApptDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. City Medical Center, Room 4B" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Pre-appointment instructions, questions to ask..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Schedule
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outcome dialog */}
      <Dialog open={!!outcomeDialog} onOpenChange={() => setOutcomeDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Appointment Completed</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Outcome / Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea placeholder="What happened? Any follow-up required?" value={outcome} onChange={e => setOutcome(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={submitOutcome} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Mark Complete
              </Button>
              <Button variant="outline" onClick={() => setOutcomeDialog(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyCard text="No upcoming appointments" subtext="Schedule one to stay on top of care" />
          ) : (
            <div className="space-y-3">
              {upcoming.map(appt => (
                <ApptCard key={appt.id} appt={appt} onComplete={handleComplete} onCancel={handleCancel} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <EmptyCard text="No past appointments" subtext="Completed and cancelled appointments appear here" />
          ) : (
            <div className="space-y-3">
              {past.map(appt => (
                <ApptCard key={appt.id} appt={appt} onComplete={handleComplete} onCancel={handleCancel} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ApptCard({ appt, onComplete, onCancel, onDelete }: {
  appt: Appointment
  onComplete: (a: Appointment) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
}) {
  const statusColors: Record<string, string> = {
    upcoming: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-600',
  }

  return (
    <Card>
      <CardContent className="py-4 px-4 flex items-start gap-4">
        <div className="bg-emerald-50 rounded-lg p-3 flex-shrink-0 text-center min-w-[56px]">
          <div className="text-xs text-emerald-600 font-medium">{format(parseISO(appt.appointment_date), 'MMM')}</div>
          <div className="text-xl font-bold text-emerald-700 leading-tight">{format(parseISO(appt.appointment_date), 'd')}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="font-semibold">{appt.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
              {appt.status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {format(parseISO(appt.appointment_date), 'h:mm a')}
            {appt.doctor_name && <><User className="h-3 w-3 inline mx-1" />{appt.doctor_name}</>}
            {appt.location && <><MapPin className="h-3 w-3 inline mx-1" />{appt.location}</>}
          </div>
          {appt.notes && <div className="text-xs text-muted-foreground mt-1 italic">{appt.notes}</div>}
          {appt.outcome && <div className="text-xs text-blue-700 mt-1 bg-blue-50 rounded px-2 py-1">Outcome: {appt.outcome}</div>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {appt.status === 'upcoming' && (
              <>
                <DropdownMenuItem onClick={() => onComplete(appt)}>
                  <Check className="h-4 w-4 mr-2 text-green-600" />Mark Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCancel(appt.id)}>
                  <X className="h-4 w-4 mr-2 text-orange-500" />Cancel
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(appt.id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

function EmptyCard({ text, subtext }: { text: string; subtext: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
        <Calendar className="h-10 w-10 text-muted-foreground/40" />
        <div className="font-medium text-muted-foreground">{text}</div>
        <div className="text-sm text-muted-foreground/70">{subtext}</div>
      </CardContent>
    </Card>
  )
}
