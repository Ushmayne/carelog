import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfile } from '@/app/actions/profile'
import { ProfileClient } from '@/components/profile/ProfileClient'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  return <ProfileClient profile={profile} />
}
