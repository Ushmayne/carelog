'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CareDocument } from '@/types'

export async function getDocuments(careGroupId: string): Promise<CareDocument[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*, uploader:profiles(full_name)')
    .eq('care_group_id', careGroupId)
    .order('created_at', { ascending: false })
  return (data ?? []) as CareDocument[]
}

export async function createDocument(careGroupId: string, formData: {
  name: string
  description?: string
  category: CareDocument['category']
  file_url: string
  file_name: string
  file_type: string
  file_size?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('documents').insert({
    ...formData,
    care_group_id: careGroupId,
    uploaded_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/documents')
}

export async function deleteDocument(id: string, filePath: string) {
  const supabase = await createClient()

  const { error: storageError } = await supabase.storage
    .from('care-documents')
    .remove([filePath])
  if (storageError) console.warn('Storage delete failed:', storageError.message)

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/documents')
}
