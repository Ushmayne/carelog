'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isBefore, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { updateTaskStatus } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'

interface TaskSummary {
  id: string
  title: string
  due_date?: string | null
}

export function TodayTasks({ tasks }: { tasks: TaskSummary[] }) {
  const router = useRouter()
  const [done, setDone] = useState<Set<string>>(new Set())

  async function complete(id: string, title: string) {
    setDone(prev => new Set(prev).add(id))
    try {
      await updateTaskStatus(id, 'completed')
      toast.success(`Done: ${title}`)
      router.refresh()
    } catch (err) {
      setDone(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error(err instanceof Error ? err.message : 'Couldn’t update that task.')
    }
  }

  if (tasks.length === 0) {
    return <p className="py-1 text-sm text-muted-foreground">Nothing assigned to you right now.</p>
  }

  return (
    <ul className="flex flex-col">
      {tasks.map(task => {
        const due = describeDue(task.due_date)
        const checked = done.has(task.id)
        return (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={checked}
                disabled={checked}
                onChange={() => complete(task.id, task.title)}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
              />
              <span className="flex min-w-0 flex-col">
                <span className={cn('font-medium', checked && 'text-muted-foreground line-through')}>{task.title}</span>
                {due && <span className={cn('text-sm', due.urgent ? 'font-medium text-urgent-foreground' : 'text-muted-foreground')}>{due.label}</span>}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function describeDue(due?: string | null) {
  if (!due) return null
  const date = parseISO(due)
  if (isBefore(date, startOfDay(new Date()))) return { label: `Overdue · was due ${format(date, 'MMM d')}`, urgent: true }
  if (isToday(date)) return { label: 'Due today', urgent: true }
  if (isTomorrow(date)) return { label: 'Due tomorrow', urgent: true }
  return { label: `Due ${format(date, 'MMM d')}`, urgent: false }
}
