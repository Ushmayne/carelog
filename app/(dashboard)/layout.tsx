import { redirect } from 'next/navigation'
import { differenceInYears, parseISO } from 'date-fns'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { getUserCareGroup, getUserCareGroups } from '@/app/actions/care-group'
import { getProfile } from '@/app/actions/profile'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const [group, allGroups, profile] = await Promise.all([
    getUserCareGroup(),
    getUserCareGroups(),
    getProfile(),
  ])

  const recipient = Array.isArray(group?.care_recipient)
    ? group.care_recipient[0]
    : group?.care_recipient
  const age = recipient?.date_of_birth
    ? differenceInYears(new Date(), parseISO(recipient.date_of_birth))
    : undefined

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar
        careGroupName={group?.name}
        recipientName={recipient?.name}
        recipientDetail={age !== undefined ? `${age} years old` : undefined}
        activeGroupId={group?.id}
        emergencyToken={group?.emergency_token}
        userName={profile?.full_name?.split(' ')[0]}
        allGroups={allGroups.map(g => ({
          id: g.id,
          name: g.name,
          recipientName: (Array.isArray(g.care_recipient) ? g.care_recipient[0]?.name : g.care_recipient?.name) ?? undefined,
        }))}
      />
      <main id="main" className="min-w-0 flex-1 pb-24 md:pb-0">
        {children}
      </main>
    </div>
  )
}
