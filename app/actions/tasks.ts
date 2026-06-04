'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns'

export async function getTasks(careGroupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name, email), creator:profiles!tasks_created_by_fkey(full_name)')
    .eq('care_group_id', careGroupId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createTask(careGroupId: string, formData: {
  title: string
  description?: string
  assigned_to?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  recurrence?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  recurrence_ends_at?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('tasks').insert({
    ...formData,
    care_group_id: careGroupId,
    created_by: user.id,
    status: 'pending',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  const updates: Record<string, unknown> = { status }
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) throw new Error(error.message)

  // Spawn next recurring instance when completed
  if (status === 'completed' && task.recurrence) {
    const baseDate = task.due_date ? parseISO(task.due_date) : new Date()
    let nextDate: Date
    switch (task.recurrence) {
      case 'daily':     nextDate = addDays(baseDate, 1); break
      case 'weekly':    nextDate = addWeeks(baseDate, 1); break
      case 'biweekly':  nextDate = addWeeks(baseDate, 2); break
      case 'monthly':   nextDate = addMonths(baseDate, 1); break
      default:          nextDate = addDays(baseDate, 1)
    }
    const nextDueDate = format(nextDate, 'yyyy-MM-dd')

    if (!task.recurrence_ends_at || nextDueDate <= task.recurrence_ends_at) {
      await supabase.from('tasks').insert({
        care_group_id: task.care_group_id,
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        due_date: nextDueDate,
        priority: task.priority,
        status: 'pending',
        recurrence: task.recurrence,
        recurrence_ends_at: task.recurrence_ends_at,
        parent_task_id: id,
      })
    }
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
}
