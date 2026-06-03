'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function updateProfile({ fullName, phoneNumber }: { fullName: string; phoneNumber?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName, phone_number: phoneNumber ?? null })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}
