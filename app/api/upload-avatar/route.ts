import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function detectImageType(buf: Buffer): boolean {
  if (buf.length < 12) return false
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  const isWebP = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  const isGif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
  return isJpeg || isPng || isWebP || isGif
}

export async function POST(request: NextRequest) {
  try {
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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be smaller than 5 MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (!detectImageType(buffer)) {
      return NextResponse.json({ error: 'File content does not match an allowed image format' }, { status: 400 })
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = extMap[file.type] ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const admin = createAdminClient()
    const { error } = await admin.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

    return NextResponse.json({ publicUrl })
  } catch (err) {
    console.error('Avatar upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
