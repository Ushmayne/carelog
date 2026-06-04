'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const ACTIVE_GROUP_COOKIE = 'active_care_group_id'

async function persistActiveGroup(groupId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}

export async function createCareGroup(name: string, recipientName: string, dateOfBirth?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  const { data: group, error: groupError } = await admin
    .from('care_groups')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (groupError) throw new Error(groupError.message)

  await Promise.all([
    admin.from('group_members').insert({ care_group_id: group.id, user_id: user.id, role: 'admin', status: 'approved' }),
    admin.from('care_recipients').insert({ care_group_id: group.id, name: recipientName, date_of_birth: dateOfBirth || null }),
  ])

  await persistActiveGroup(group.id)
  revalidatePath('/dashboard')
  return group
}

export async function joinCareGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  const { data: group, error: groupError } = await admin
    .from('care_groups')
    .select()
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single()

  if (groupError || !group) throw new Error('Invalid invite code')

  const { error: memberError } = await admin.from('group_members').insert({
    care_group_id: group.id,
    user_id: user.id,
    role: 'member',
    status: 'pending',
  })

  if (memberError) {
    if (memberError.code === '23505') throw new Error('You already have a pending or active membership in this group')
    throw new Error(memberError.message)
  }

  return { group, joinStatus: 'pending' as const }
}

export async function getUserCareGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data: memberships } = await admin
    .from('group_members')
    .select('care_group_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('joined_at', { ascending: true })

  if (!memberships?.length) return []

  const { data: groups } = await admin
    .from('care_groups')
    .select('*, care_recipient:care_recipients(*)')
    .in('id', memberships.map(m => m.care_group_id))

  if (!groups) return []

  // Preserve membership join order
  const order = memberships.map(m => m.care_group_id)
  return groups.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
}

export async function getUserCareGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from('group_members')
    .select('care_group_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('joined_at', { ascending: true })

  if (!memberships?.length) return null

  const validIds = memberships.map(m => m.care_group_id)
  const cookieStore = await cookies()
  const cookieGroupId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value
  const activeGroupId = validIds.includes(cookieGroupId ?? '') ? cookieGroupId! : validIds[0]

  const { data: group } = await admin
    .from('care_groups')
    .select('*, care_recipient:care_recipients(*)')
    .eq('id', activeGroupId)
    .single()

  return group
}

export async function getGroupMembers(careGroupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('care_group_id', careGroupId)
    .order('joined_at', { ascending: true })

  return data ?? []
}

export async function setActiveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await persistActiveGroup(groupId)
  revalidatePath('/', 'layout')
}

export async function approveGroupMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('group_members')
    .select('care_group_id')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Member not found')

  const { data: caller } = await admin
    .from('group_members')
    .select('role')
    .eq('care_group_id', member.care_group_id)
    .eq('user_id', user.id)
    .single()

  if (caller?.role !== 'admin') throw new Error('Only admins can approve members')

  const { error } = await admin
    .from('group_members')
    .update({ status: 'approved' })
    .eq('id', memberId)

  if (error) throw new Error(error.message)

  revalidatePath('/family')
}

export async function removeGroupMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('group_members')
    .select('care_group_id, user_id')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Member not found')

  const { data: caller } = await admin
    .from('group_members')
    .select('role')
    .eq('care_group_id', member.care_group_id)
    .eq('user_id', user.id)
    .single()

  if (caller?.role !== 'admin') throw new Error('Only admins can remove members')
  if (member.user_id === user.id) throw new Error('You cannot remove yourself from the group')

  const { error } = await admin
    .from('group_members')
    .delete()
    .eq('id', memberId)

  if (error) throw new Error(error.message)

  revalidatePath('/family')
}
