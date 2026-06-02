'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function today() {
  return new Date().toISOString().split('T')[0]
}

export async function getChecklistItems(careGroupId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('checklist_items')
    .select('*')
    .eq('care_group_id', careGroupId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getTodayCompletions(careGroupId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('checklist_completions')
    .select('*')
    .eq('care_group_id', careGroupId)
    .eq('completed_date', today())
  return data ?? []
}

export async function addChecklistItem(careGroupId: string, title: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('checklist_items')
    .select('order_index')
    .eq('care_group_id', careGroupId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing?.[0]?.order_index != null ? existing[0].order_index + 1 : 0

  const { error } = await admin.from('checklist_items').insert({
    care_group_id: careGroupId,
    title: title.trim(),
    description: description?.trim() || null,
    order_index: nextIndex,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/checklist')
}

export async function deleteChecklistItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin.from('checklist_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/checklist')
}

export async function toggleCompletion(itemId: string, careGroupId: string, complete: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const date = today()

  if (complete) {
    await admin
      .from('checklist_completions')
      .delete()
      .eq('checklist_item_id', itemId)
      .neq('completed_date', date)

    const { error } = await admin.from('checklist_completions').insert({
      checklist_item_id: itemId,
      care_group_id: careGroupId,
      completed_by: user.id,
      completed_date: date,
    })
    if (error && error.code !== '23505') throw new Error(error.message)
  } else {
    await admin
      .from('checklist_completions')
      .delete()
      .eq('checklist_item_id', itemId)
      .eq('completed_date', date)
  }

  revalidatePath('/checklist')
}
