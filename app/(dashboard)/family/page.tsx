import { getUserCareGroup, getGroupMembers } from '@/app/actions/care-group'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilyClient } from '@/components/family/FamilyClient'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const members = await getGroupMembers(group.id)

  return (
    <FamilyClient
      group={group}
      members={members}
      currentUserId={user?.id ?? ''}
    />
  )
}
