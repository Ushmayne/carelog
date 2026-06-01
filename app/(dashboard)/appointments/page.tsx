import { getUserCareGroup } from '@/app/actions/care-group'
import { getAppointments } from '@/app/actions/appointments'
import { redirect } from 'next/navigation'
import { AppointmentsClient } from '@/components/appointments/AppointmentsClient'

export default async function AppointmentsPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const appointments = await getAppointments(group.id)

  return <AppointmentsClient careGroupId={group.id} appointments={appointments} />
}
