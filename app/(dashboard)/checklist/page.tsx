import { getUserCareGroup } from '@/app/actions/care-group'
import { getChecklistItems, getTodayCompletions } from '@/app/actions/checklist'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChecklistClient } from '@/components/checklist/ChecklistClient'

export default async function ChecklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const [items, completions] = await Promise.all([
    getChecklistItems(group.id),
    getTodayCompletions(group.id),
  ])

  return (
    <ChecklistClient
      careGroupId={group.id}
      recipientName={group.care_recipient?.name ?? 'your loved one'}
      items={items}
      todayCompletions={completions}
      currentUserId={user?.id ?? ''}
    />
  )
}
