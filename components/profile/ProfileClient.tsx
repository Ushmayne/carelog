'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Camera, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile, updateAvatar } from '@/app/actions/profile'
import { format, parseISO } from 'date-fns'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export function ProfileClient({ profile }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')

      await updateAvatar(json.publicUrl)
      setAvatarUrl(json.publicUrl)
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined })
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Profile Picture</CardTitle>
            <CardDescription>Click the photo to upload a new one (max 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && fileInputRef.current?.click()}>
                <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-border flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-semibold">
                      {fullName ? getInitials(fullName) : '?'}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                    : <Camera className="h-5 w-5 text-white" />
                  }
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    : 'Change photo'
                  }
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, GIF up to 5MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className="bg-muted cursor-not-allowed text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {profile?.created_at && (
                <p className="text-xs text-muted-foreground pt-1">
                  Member since {format(parseISO(profile.created_at), 'MMMM d, yyyy')}
                </p>
              )}

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
