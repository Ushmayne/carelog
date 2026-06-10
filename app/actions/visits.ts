'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { visitNoteSchema, parseOrThrow } from '@/lib/validations'

export async function getVisitNotes(careGroupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('visit_notes')
    .select('*, visitor:profiles!visit_notes_visited_by_fkey(full_name, email)')
    .eq('care_group_id', careGroupId)
    .order('visit_date', { ascending: false })
  return data ?? []
}

export async function createVisitNote(careGroupId: string, formData: {
  visit_date: string
  duration_minutes?: number
  mood?: 'good' | 'fair' | 'poor'
  notes: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = parseOrThrow(visitNoteSchema, formData)

  const { error } = await supabase.from('visit_notes').insert({
    ...validated,
    care_group_id: careGroupId,
    visited_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/visits')
  revalidatePath('/dashboard')
}

export async function deleteVisitNote(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('visit_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/visits')
}
