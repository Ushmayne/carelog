'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CareDocument } from '@/types'
import { documentSchema, parseOrThrow } from '@/lib/validations'
import { requireGroupMember } from '@/lib/auth'

const BUCKET = 'care-documents'
const SIGNED_URL_SECONDS = 60

// The file_url column holds the storage path ("<groupId>/<file>").
// Older rows stored a full public URL, so pull the path out of those.
function storagePath(fileUrl: string): string {
  if (!/^https?:\/\//.test(fileUrl)) return fileUrl
  const after = new URL(fileUrl).pathname.split(`/${BUCKET}/`)[1] ?? ''
  return decodeURIComponent(after)
}

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
  file_path: string
  file_name: string
  file_type: string
  file_size?: number
}) {
  const { user, admin } = await requireGroupMember(careGroupId)
  const { file_path, ...validated } = parseOrThrow(documentSchema, formData)

  // The file must sit in this group's folder, so nobody can attach another group's file.
  if (!file_path.startsWith(`${careGroupId}/`)) throw new Error('Invalid file path')

  const { error } = await admin.from('documents').insert({
    ...validated,
    file_url: file_path,
    care_group_id: careGroupId,
    uploaded_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/documents')
}

// Returns a short-lived link to the file. Only approved group members get one.
export async function getDocumentUrl(id: string): Promise<string> {
  const { admin, doc } = await loadDocumentForMember(id)

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath(doc.file_url), SIGNED_URL_SECONDS)
  if (error || !data) throw new Error('Could not open document')
  return data.signedUrl
}

export async function deleteDocument(id: string) {
  const { admin, doc } = await loadDocumentForMember(id)

  const { error: storageError } = await admin.storage.from(BUCKET).remove([storagePath(doc.file_url)])
  if (storageError) throw new Error(`Failed to delete file: ${storageError.message}`)

  const { error } = await admin.from('documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/documents')
}

async function loadDocumentForMember(id: string) {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('documents')
    .select('id, care_group_id, file_url')
    .eq('id', id)
    .maybeSingle()
  if (!doc) throw new Error('Document not found')

  const { admin } = await requireGroupMember(doc.care_group_id)
  return { admin, doc }
}
