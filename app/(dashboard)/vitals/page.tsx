import { getUserCareGroup } from '@/app/actions/care-group'
import { getVitals } from '@/app/actions/vitals'
import { redirect } from 'next/navigation'
import { VitalsClient } from '@/components/vitals/VitalsClient'

export default async function VitalsPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const vitals = await getVitals(group.id)

  return <VitalsClient careGroupId={group.id} vitals={vitals} />
}
