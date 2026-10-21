import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { CareGroup } from '@/types'

type CareGroupWithRecipient = CareGroup & { care_recipient?: any }

// Per-request lookups shared by the dashboard layout and pages.
// React's cache() runs each one at most once per request, so a page that asks
// for the user or care group several times only pays for one Supabase round trip.

export const ACTIVE_GROUP_COOKIE = 'active_care_group_id'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

// All approved groups for the signed-in user, in the order they joined.
export const getApprovedCareGroups = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('group_members')
    .select('care_group:care_groups(*, care_recipient:care_recipients(*))')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('joined_at', { ascending: true })

  // Supabase's generated types treat the embedded group as a list; at runtime it's one row.
  // care_recipient stays loosely typed, as before, since callers handle both shapes.
  return (data ?? [])
    .map(m => m.care_group as unknown as CareGroupWithRecipient | null)
    .filter((g): g is CareGroupWithRecipient => g != null)
})

// The group picked in the switcher (stored in a cookie), or the first one joined.
export const getActiveCareGroup = cache(async () => {
  const groups = await getApprovedCareGroups()
  if (!groups.length) return null

  const cookieGroupId = (await cookies()).get(ACTIVE_GROUP_COOKIE)?.value
  return groups.find(g => g.id === cookieGroupId) ?? groups[0]
})

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
})
