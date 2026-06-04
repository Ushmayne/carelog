import { getUserCareGroup } from '@/app/actions/care-group'
import { getActivityFeed } from '@/app/actions/activity'
import { redirect } from 'next/navigation'
import { ActivityClient } from '@/components/activity/ActivityClient'

export default async function ActivityPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const items = await getActivityFeed(group.id, 100)

  return <ActivityClient items={items} />
}
