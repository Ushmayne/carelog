'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAppointments(careGroupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select('*, creator:profiles!appointments_created_by_fkey(full_name)')
    .eq('care_group_id', careGroupId)
    .order('appointment_date', { ascending: true })
  return data ?? []
}

export async function createAppointment(careGroupId: string, formData: {
  title: string
  doctor_name?: string
  location?: string
  appointment_date: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('appointments').insert({
    ...formData,
    care_group_id: careGroupId,
    created_by: user.id,
    status: 'upcoming',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/appointments')
  revalidatePath('/dashboard')
}

export async function updateAppointmentStatus(id: string, status: 'upcoming' | 'completed' | 'cancelled', outcome?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('appointments').update({ status, outcome }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/appointments')
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/appointments')
}
