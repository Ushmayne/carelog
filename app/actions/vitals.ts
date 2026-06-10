'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { VitalReading } from '@/types'
import { vitalSchema, parseOrThrow } from '@/lib/validations'

export async function getVitals(careGroupId: string): Promise<VitalReading[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vital_readings')
    .select('*, recorder:profiles(full_name)')
    .eq('care_group_id', careGroupId)
    .order('recorded_at', { ascending: false })
    .limit(200)
  return (data ?? []) as VitalReading[]
}

export async function getLatestVitals(careGroupId: string): Promise<Partial<Record<VitalReading['type'], VitalReading>>> {
  const supabase = await createClient()
  const types: VitalReading['type'][] = [
    'blood_pressure', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'oxygen_saturation',
  ]
  const results = await Promise.all(
    types.map(async type => {
      const { data } = await supabase
        .from('vital_readings')
        .select('*, recorder:profiles(full_name)')
        .eq('care_group_id', careGroupId)
        .eq('type', type)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return [type, data] as const
    })
  )
  return Object.fromEntries(results.filter(([, v]) => v !== null)) as Partial<Record<VitalReading['type'], VitalReading>>
}

export async function addVital(careGroupId: string, formData: {
  type: VitalReading['type']
  value: string
  unit: string
  notes?: string
  recorded_at: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = parseOrThrow(vitalSchema, formData)

  const { error } = await supabase.from('vital_readings').insert({
    ...validated,
    care_group_id: careGroupId,
    recorded_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/vitals')
  revalidatePath('/dashboard')
}

export async function deleteVital(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vital_readings').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/vitals')
}
