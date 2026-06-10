'use client'

import { useState } from 'react'
import { createVisitNote, deleteVisitNote } from '@/app/actions/visits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardList, Plus, Loader2, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { VisitNote } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  careGroupId: string
  visits: VisitNote[]
}

const moodConfig = {
  good: { label: 'Good', emoji: '😊', bg: 'bg-green-50', text: 'text-green-700' },
  fair: { label: 'Fair', emoji: '😐', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  poor: { label: 'Poor', emoji: '😟', bg: 'bg-red-50', text: 'text-red-700' },
}

export function VisitsClient({ careGroupId, visits }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [duration, setDuration] = useState('')
  const [mood, setMood] = useState<'good' | 'fair' | 'poor' | ''>('')
  const [notes, setNotes] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createVisitNote(careGroupId, {
        visit_date: visitDate,
        duration_minutes: duration ? parseInt(duration) : undefined,
        mood: (mood as 'good' | 'fair' | 'poor') || undefined,
        notes,
      })
      toast.success('Visit note saved')
      setOpen(false)
      setVisitDate(new Date().toISOString().slice(0, 10))
      setDuration(''); setMood(''); setNotes('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save visit note')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVisitNote(id)
      toast.success('Visit note deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-600" />
            Visit Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{visits.length} visit{visits.length !== 1 ? 's' : ''} logged</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Log Visit
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a Visit</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visit Date <span className="text-muted-foreground font-normal">(change for late logging)</span></Label>
                  <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration <span className="text-muted-foreground">(minutes, optional)</span></Label>
                  <Input type="number" placeholder="e.g. 90" value={duration} onChange={e => setDuration(e.target.value)} min="1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Overall Mood <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={mood} onValueChange={v => setMood((v ?? '') as 'good' | 'fair' | 'poor')}>
                  <SelectTrigger><SelectValue placeholder="How was their mood?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good" label="😊 Good">😊 Good</SelectItem>
                    <SelectItem value="fair" label="😐 Fair">😐 Fair</SelectItem>
                    <SelectItem value="poor" label="😟 Poor">😟 Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="What did you observe? Any concerns, improvements, or things to share with the family?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Note
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <div className="font-medium text-muted-foreground">No visit notes yet</div>
            <div className="text-sm text-muted-foreground/70">Log your first visit to keep the family informed</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visits.map(visit => {
            const mc = visit.mood ? moodConfig[visit.mood] : null
            return (
              <Card key={visit.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-50 rounded-lg p-3 flex-shrink-0 text-center min-w-[56px]">
                      <div className="text-xs text-purple-600 font-medium">{format(parseISO(visit.visit_date), 'MMM')}</div>
                      <div className="text-xl font-bold text-purple-700 leading-tight">{format(parseISO(visit.visit_date), 'd')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{visit.visitor?.full_name ?? 'Unknown'}</span>
                        {mc && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mc.bg} ${mc.text}`}>
                            {mc.emoji} {mc.label}
                          </span>
                        )}
                        {visit.duration_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{visit.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{visit.notes}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(visit.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
