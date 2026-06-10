import type { Metadata } from 'next'
import { getUserCareGroup } from '@/app/actions/care-group'
import { getDocuments } from '@/app/actions/documents'
import { redirect } from 'next/navigation'
import { DocumentsClient } from '@/components/documents/DocumentsClient'

export const metadata: Metadata = { title: 'Documents' }

export default async function DocumentsPage() {
  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const documents = await getDocuments(group.id)

  return <DocumentsClient careGroupId={group.id} documents={documents} />
}
