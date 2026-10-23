'use server'

import { randomBytes, randomInt } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { careGroupSchema, careRecipientSchema, inviteCodeSchema, parseOrThrow } from '@/lib/validations'
import {
  ACTIVE_GROUP_COOKIE,
  getActiveCareGroup,
  getApprovedCareGroups,
  requireGroupAdmin,
  requireGroupMember,
} from '@/lib/auth'

// No 0/o, 1/l/i, so codes are easy to read aloud and type.
const INVITE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function newInviteCode() {
  let code = ''
  for (let i = 0; i < 8; i++) code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]
  return code
}

// Long random token for the public emergency page. Separate from the invite code,
// so sharing one never hands out the other.
function newEmergencyToken() {
  return randomBytes(24).toString('base64url')
}

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

  const { name: validatedName, recipientName: validatedRecipient, dateOfBirth: validatedDob } =
    parseOrThrow(careGroupSchema, { name, recipientName, dateOfBirth })

  const admin = createAdminClient()

  const { data: group, error: groupError } = await admin
    .from('care_groups')
    // emergency_token comes from the column default (see supabase/security-fixes.sql)
    .insert({ name: validatedName, created_by: user.id, invite_code: newInviteCode() })
    .select()
    .single()

  if (groupError) throw new Error(groupError.message)

  await Promise.all([
    admin.from('group_members').insert({ care_group_id: group.id, user_id: user.id, role: 'admin', status: 'approved' }),
    admin.from('care_recipients').insert({ care_group_id: group.id, name: validatedRecipient, date_of_birth: validatedDob || null }),
  ])

  await persistActiveGroup(group.id)
  revalidatePath('/dashboard')
  return group
}

export async function joinCareGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const code = inviteCodeSchema.safeParse(inviteCode)
  if (!code.success) throw new Error('Invalid invite code')

  const admin = createAdminClient()

  // Only the id and name go back to the browser, never the group's codes.
  const { data: group, error: groupError } = await admin
    .from('care_groups')
    .select('id, name')
    .eq('invite_code', code.data)
    .maybeSingle()

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
  return getApprovedCareGroups()
}

export async function getUserCareGroup() {
  return getActiveCareGroup()
}

export async function getGroupMembers(careGroupId: string) {
  let admin
  try {
    ({ admin } = await requireGroupMember(careGroupId))
  } catch {
    return []
  }

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

async function getMemberRow(memberId: string) {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('group_members')
    .select('care_group_id, user_id')
    .eq('id', memberId)
    .maybeSingle()
  if (!member) throw new Error('Member not found')
  return member
}

export async function approveGroupMember(memberId: string) {
  const member = await getMemberRow(memberId)
  const { admin } = await requireGroupAdmin(member.care_group_id)

  const { error } = await admin
    .from('group_members')
    .update({ status: 'approved' })
    .eq('id', memberId)

  if (error) throw new Error(error.message)

  revalidatePath('/family')
}

export async function updateCareRecipient(careGroupId: string, data: {
  name: string
  date_of_birth?: string
  emergency_contact?: string
  emergency_contact_phone?: string
  allergies?: string[]
  medical_conditions?: string[]
  doctor_name?: string
  doctor_phone?: string
  notes?: string
}) {
  const { admin } = await requireGroupAdmin(careGroupId)
  const validated = parseOrThrow(careRecipientSchema, data)

  const { error } = await admin
    .from('care_recipients')
    .update(validated)
    .eq('care_group_id', careGroupId)

  if (error) throw new Error(error.message)

  revalidatePath('/family')
}

export async function removeGroupMember(memberId: string) {
  const member = await getMemberRow(memberId)
  const { admin, user } = await requireGroupAdmin(member.care_group_id)
  if (member.user_id === user.id) throw new Error('You cannot remove yourself from the group')

  const { error } = await admin
    .from('group_members')
    .delete()
    .eq('id', memberId)

  if (error) throw new Error(error.message)

  revalidatePath('/family')
}

// Makes the old invite code stop working. Pending requests are kept.
export async function regenerateInviteCode(careGroupId: string) {
  const { admin } = await requireGroupAdmin(careGroupId)

  const { error } = await admin
    .from('care_groups')
    .update({ invite_code: newInviteCode() })
    .eq('id', careGroupId)
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
}

// Makes the old emergency page link stop working.
export async function regenerateEmergencyLink(careGroupId: string) {
  const { admin } = await requireGroupAdmin(careGroupId)

  const { error } = await admin
    .from('care_groups')
    .update({ emergency_token: newEmergencyToken() })
    .eq('id', careGroupId)
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
}
