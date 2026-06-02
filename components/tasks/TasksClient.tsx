'use client'

import { useState } from 'react'
import { createTask, updateTaskStatus, deleteTask } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckSquare, Plus, Loader2, Trash2, Check, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { Task, GroupMember } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  careGroupId: string
  tasks: Task[]
  members: GroupMember[]
  currentUserId: string
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'outline' as const },
  in_progress: { label: 'In Progress', variant: 'secondary' as const },
  completed: { label: 'Completed', variant: 'default' as const },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const },
}

export function TasksClient({ careGroupId, tasks, members, currentUserId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createTask(careGroupId, {
        title,
        description: description || undefined,
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        priority,
      })
      toast.success('Task created')
      setOpen(false)
      setTitle(''); setDescription(''); setAssignedTo(''); setDueDate(''); setPriority('medium')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      await updateTaskStatus(id, status)
      toast.success(`Task marked as ${status.replace('_', ' ')}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const doneTasks = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled')
  const myTasks = activeTasks.filter(t => t.assigned_to === currentUserId)
  const unassigned = activeTasks.filter(t => !t.assigned_to)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-orange-600" />
            Tasks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{activeTasks.length} active, {doneTasks.length} completed</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Add Task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input placeholder="e.g. Pick up prescriptions" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="More details..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assign To <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={assignedTo} onValueChange={v => setAssignedTo(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned">
                        {(value: string | null) => {
                          if (!value) return null
                          const m = members.find(m => m.user_id === value)
                          if (!m) return value
                          const name = m.profile?.full_name ?? value
                          return m.user_id === currentUserId ? `${name} (me)` : name
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(m => {
                        const name = m.profile?.full_name ?? m.user_id
                        const label = m.user_id === currentUserId ? `${name} (me)` : name
                        return (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={v => { if (v) setPriority(v as typeof priority) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" label="Low">Low</SelectItem>
                      <SelectItem value="medium" label="Medium">Medium</SelectItem>
                      <SelectItem value="high" label="High">High</SelectItem>
                      <SelectItem value="urgent" label="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date <span className="text-muted-foreground">(optional)</span></Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Task
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active ({activeTasks.length})</TabsTrigger>
          <TabsTrigger value="mine">My Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <TaskList tasks={activeTasks} onStatus={handleStatusChange} onDelete={handleDelete} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="mine">
          <TaskList tasks={myTasks} onStatus={handleStatusChange} onDelete={handleDelete} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="done">
          <TaskList tasks={doneTasks} onStatus={handleStatusChange} onDelete={handleDelete} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TaskList({ tasks, onStatus, onDelete, currentUserId }: {
  tasks: Task[]
  onStatus: (id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  onDelete: (id: string) => void
  currentUserId: string
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
          <CheckSquare className="h-10 w-10 text-muted-foreground/40" />
          <div className="font-medium text-muted-foreground">No tasks here</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const pc = priorityConfig[task.priority]
        const sc = statusConfig[task.status]
        const isCompleted = task.status === 'completed'
        return (
          <Card key={task.id} className={isCompleted ? 'opacity-70' : ''}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <button
                onClick={() => onStatus(task.id, isCompleted ? 'pending' : 'completed')}
                className={`mt-0.5 h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  isCompleted ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-600'
                }`}
              >
                {isCompleted && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pc.className}`}>
                    {pc.label}
                  </span>
                  {task.assignee && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee.full_name}
                      {task.assigned_to === currentUserId ? ' (me)' : ''}
                    </span>
                  )}
                  {!task.assigned_to && (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {format(parseISO(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <Select value={task.status} onValueChange={v => { if (v) onStatus(task.id, v as 'pending' | 'in_progress' | 'completed' | 'cancelled') }}>
                    <SelectTrigger className="h-7 text-xs w-[110px]">
                      <SelectValue>
                        {(value: string | null) => statusConfig[value as keyof typeof statusConfig]?.label ?? value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
