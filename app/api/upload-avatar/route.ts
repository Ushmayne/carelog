import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  return NextResponse.json({ publicUrl })
}
