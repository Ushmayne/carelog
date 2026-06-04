'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMedications(careGroupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('medications')
    .select('*')
    .eq('care_group_id', careGroupId)
    .order('active', { ascending: false })
    .order('name', { ascending: true })
  return data ?? []
}

export async function getMedicationLogs(careGroupId: string, limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('medication_logs')
    .select('*, medication:medications(name, dosage), profile:profiles(full_name)')
    .eq('care_group_id', careGroupId)
    .order('administered_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function createMedication(careGroupId: string, formData: {
  name: string
  dosage: string
  frequency: string
  instructions?: string
  prescribing_doctor?: string
  scheduled_times?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('medications').insert({
    ...formData,
    care_group_id: careGroupId,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/medications')
}

export async function toggleMedicationActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('medications').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/medications')
}

export async function deleteMedication(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('medications').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/medications')
}

export async function logMedication(careGroupId: string, formData: {
  medication_id: string
  administered_at: string
  notes?: string
  skipped?: boolean
  skip_reason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('medication_logs').insert({
    ...formData,
    care_group_id: careGroupId,
    administered_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/medications')
  revalidatePath('/dashboard')
}
