import { getUserCareGroup } from '@/app/actions/care-group'
import { getChecklistItems, getCompletionsForDate } from '@/app/actions/checklist'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChecklistClient } from '@/components/checklist/ChecklistClient'

type PageProps = {
  searchParams: Promise<{ date?: string }>
}

export default async function ChecklistPage({ searchParams }: PageProps) {
  const { date: dateParam } = await searchParams

  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= todayStr
      ? dateParam
      : todayStr
  const isToday = selectedDate === todayStr

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const [items, completions] = await Promise.all([
    getChecklistItems(group.id),
    getCompletionsForDate(group.id, selectedDate),
  ])

  return (
    <ChecklistClient
      key={selectedDate}
      careGroupId={group.id}
      recipientName={group.care_recipient?.name ?? 'your loved one'}
      items={items}
      todayCompletions={completions}
      currentUserId={user?.id ?? ''}
      selectedDate={selectedDate}
      isToday={isToday}
    />
  )
}
