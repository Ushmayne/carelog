'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
}
