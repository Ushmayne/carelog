import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getUserCareGroup, getUserCareGroups } from '@/app/actions/care-group'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [group, allGroups] = await Promise.all([
    getUserCareGroup(),
    getUserCareGroups(),
  ])

  const recipientName = Array.isArray(group?.care_recipient)
    ? group.care_recipient[0]?.name
    : group?.care_recipient?.name

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        careGroupName={group?.name}
        recipientName={recipientName}
        activeGroupId={group?.id}
        allGroups={allGroups.map(g => ({
          id: g.id,
          name: g.name,
          recipientName: (Array.isArray(g.care_recipient) ? g.care_recipient[0]?.name : g.care_recipient?.name) ?? undefined,
        }))}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
