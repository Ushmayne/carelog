'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { profileSchema, parseOrThrow } from '@/lib/validations'

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

  const { fullName: validatedName, phoneNumber: validatedPhone } = parseOrThrow(profileSchema, { fullName, phoneNumber })

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ full_name: validatedName, phone_number: validatedPhone ?? null })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!avatarUrl.startsWith('https://')) throw new Error('Invalid avatar URL')

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}
