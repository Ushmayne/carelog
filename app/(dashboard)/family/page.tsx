import type { Metadata } from 'next'
import { getUserCareGroup, getGroupMembers } from '@/app/actions/care-group'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilyClient } from '@/components/family/FamilyClient'

export const metadata: Metadata = { title: 'Family & Care Team' }

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const members = await getGroupMembers(group.id)

  const currentUserMember = members.find(m => m.user_id === user?.id)
  const currentUserRole = currentUserMember?.role ?? 'member'

  return (
    <FamilyClient
      group={group}
      members={members}
      currentUserId={user?.id ?? ''}
      currentUserRole={currentUserRole}
    />
  )
}
