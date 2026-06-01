import { getUserCareGroup } from '@/app/actions/care-group'
import { getVisitNotes } from '@/app/actions/visits'
import { redirect } from 'next/navigation'
import { VisitsClient } from '@/components/visits/VisitsClient'

export default async function VisitsPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const visits = await getVisitNotes(group.id)

  return <VisitsClient careGroupId={group.id} visits={visits} />
}
