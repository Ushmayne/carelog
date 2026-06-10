import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/app/actions/profile'
import { ProfileClient } from '@/components/profile/ProfileClient'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  return <ProfileClient profile={profile} />
}
