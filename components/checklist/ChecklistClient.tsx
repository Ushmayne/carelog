'use client'

import { useState } from 'react'
import { addChecklistItem, deleteChecklistItem, toggleCompletion } from '@/app/actions/checklist'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ClipboardCheck, Plus, Trash2, Loader2, Check, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import type { ChecklistItem, ChecklistCompletion } from '@/types'

interface Props {
  careGroupId: string
  recipientName: string
  items: ChecklistItem[]
  todayCompletions: ChecklistCompletion[]
  currentUserId: string
  selectedDate: string
  isToday: boolean
}

export function ChecklistClient({ careGroupId, recipientName, items, todayCompletions, currentUserId, selectedDate, isToday }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(todayCompletions.map(c => c.checklist_item_id))
  )

  const completionByItem = new Map(todayCompletions.map(c => [c.checklist_item_id, c]))

  const doneCount = items.filter(i => completedIds.has(i.id)).length
  const totalCount = items.length
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)
  const allDone = totalCount > 0 && doneCount === totalCount

  const selectedDateObj = new Date(selectedDate + 'T00:00:00')

  function navigateDate(delta: number) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const newDateStr = d.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]
    if (newDateStr > todayStr) return
    router.push(newDateStr === todayStr ? '/checklist' : `/checklist?date=${newDateStr}`)
  }

  async function handleToggle(itemId: string) {
    if (!isToday) return
    const wasComplete = completedIds.has(itemId)
    setCompletedIds(prev => {
      const next = new Set(prev)
      wasComplete ? next.delete(itemId) : next.add(itemId)
      return next
    })
    try {
      await toggleCompletion(itemId, careGroupId, !wasComplete)
      router.refresh()
    } catch {
      setCompletedIds(prev => {
        const next = new Set(prev)
        wasComplete ? next.add(itemId) : next.delete(itemId)
        return next
      })
      toast.error('Failed to update item')
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAddLoading(true)
    try {
      await addChecklistItem(careGroupId, title, description)
      toast.success('Item added')
      setTitle('')
      setDescription('')
      setDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    try {
      await deleteChecklistItem(itemId)
      toast.success('Item removed')
      setCompletedIds(prev => { const next = new Set(prev); next.delete(itemId); return next })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove item')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
            Daily Checklist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">caring for {recipientName}</p>
        </div>
        {isToday && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" />Add Item
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Checklist Item</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Task</Label>
                  <Input
                    placeholder="e.g. Morning medications"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea
                    placeholder="Any extra details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={addLoading} className="flex-1">
                    {addLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add to Checklist
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-5 bg-muted/50 rounded-lg px-3 py-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {isToday
            ? `Today · ${format(selectedDateObj, 'MMMM d')}`
            : format(selectedDateObj, 'EEEE, MMMM d')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigateDate(1)}
          disabled={isToday}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">{doneCount} of {totalCount} completed</span>
            {allDone && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> All done!
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <div className="font-medium text-muted-foreground">No items yet</div>
              <div className="text-sm text-muted-foreground/70 mt-0.5">
                Add the daily tasks you want to track for {recipientName}
              </div>
            </div>
            {isToday && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />Add first item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const done = completedIds.has(item.id)
            const completion = completionByItem.get(item.id)
            const isDeleting = deletingId === item.id

            return (
              <Card
                key={item.id}
                className={`transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={!isToday}
                    className={`mt-0.5 h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      done
                        ? 'bg-blue-600 border-blue-600'
                        : isToday
                          ? 'border-gray-300 hover:border-blue-500'
                          : 'border-gray-200 cursor-default'
                    }`}
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {done && <Check className="h-3 w-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    )}
                    {done && completion && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {completion.completer?.full_name
                          ? `Completed by ${completion.completer.full_name}`
                          : 'Completed'}
                        {' · '}
                        {format(new Date(completion.created_at), 'h:mm a')}
                      </div>
                    )}
                  </div>

                  {isToday && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/50 hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
