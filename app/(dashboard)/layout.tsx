import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getUserCareGroup } from '@/app/actions/care-group'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const group = await getUserCareGroup()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        careGroupName={group?.name}
        recipientName={group?.care_recipient?.[0]?.name ?? group?.care_recipient?.name}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
