'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCareGroup(name: string, recipientName: string, dateOfBirth?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error: groupError } = await supabase
    .from('care_groups')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (groupError) throw new Error(groupError.message)

  await supabase.from('group_members').insert({
    care_group_id: group.id,
    user_id: user.id,
    role: 'admin',
  })

  await supabase.from('care_recipients').insert({
    care_group_id: group.id,
    name: recipientName,
    date_of_birth: dateOfBirth || null,
  })

  revalidatePath('/dashboard')
  return group
}

export async function joinCareGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error: groupError } = await supabase
    .from('care_groups')
    .select()
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single()

  if (groupError || !group) throw new Error('Invalid invite code')

  const { error: memberError } = await supabase.from('group_members').insert({
    care_group_id: group.id,
    user_id: user.id,
    role: 'member',
  })

  if (memberError) {
    if (memberError.code === '23505') throw new Error('You are already a member of this group')
    throw new Error(memberError.message)
  }

  revalidatePath('/dashboard')
  return group
}

export async function getUserCareGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('group_members')
    .select('care_group_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  const { data: group } = await supabase
    .from('care_groups')
    .select('*, care_recipient:care_recipients(*)')
    .eq('id', membership.care_group_id)
    .single()

  return group
}

export async function getGroupMembers(careGroupId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('care_group_id', careGroupId)
    .order('joined_at', { ascending: true })

  return data ?? []
}
