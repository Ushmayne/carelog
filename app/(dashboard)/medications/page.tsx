import { getUserCareGroup } from '@/app/actions/care-group'
import { getMedications, getMedicationLogs } from '@/app/actions/medications'
import { redirect } from 'next/navigation'
import { MedicationsClient } from '@/components/medications/MedicationsClient'

export default async function MedicationsPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const [medications, logs] = await Promise.all([
    getMedications(group.id),
    getMedicationLogs(group.id, 30),
  ])

  return <MedicationsClient careGroupId={group.id} medications={medications} logs={logs} />
}
