'use client'

import { useState } from 'react'
import { createCareGroup, joinCareGroup } from '@/app/actions/care-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SetupGroup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Create group form
  const [groupName, setGroupName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Join group form
  const [inviteCode, setInviteCode] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createCareGroup(groupName, recipientName, dateOfBirth || undefined)
      toast.success('Care group created!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await joinCareGroup(inviteCode)
      toast.success('Request sent! The group admin will need to approve your membership.')
      setInviteCode('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex bg-teal-600 rounded-2xl p-3 mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to CareLog</h1>
          <p className="text-muted-foreground mt-1">Set up your family care coordination hub</p>
        </div>

        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create">Create Group</TabsTrigger>
            <TabsTrigger value="join">Join Group</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create a care group</CardTitle>
                <CardDescription>Set up a new group for your family to coordinate care</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input
                      placeholder="e.g. The Johnson Family"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Care Recipient Name</Label>
                    <Input
                      placeholder="e.g. Mom, Dad, Margaret"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Group
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  Join an existing group
                </CardTitle>
                <CardDescription>Enter the invite code shared by your family member</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <Input
                      placeholder="e.g. abc12345"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Join Group
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
