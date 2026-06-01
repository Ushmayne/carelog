'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Copy, Check, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { CareGroup, GroupMember, CareRecipient } from '@/types'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  group: CareGroup & { care_recipient?: any }
  members: GroupMember[]
  currentUserId: string
}

export function FamilyClient({ group, members, currentUserId }: Props) {
  const [copied, setCopied] = useState(false)

  const rawRecipient = Array.isArray(group.care_recipient) ? group.care_recipient[0] : group.care_recipient
  const recipient = rawRecipient as CareRecipient | undefined

  async function copyCode() {
    await navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    toast.success('Invite code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Family Members
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in {group.name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Members list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {getInitials(member.profile?.full_name ?? 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{member.profile?.full_name ?? 'Unknown'}</span>
                      {member.user_id === currentUserId && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.profile?.email}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {member.role === 'admin' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Crown className="h-3 w-3" />Admin
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Joined {format(parseISO(member.joined_at), 'MMM d')}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Invite more members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invite Family Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Share this invite code with family members so they can join the care group.
                They&apos;ll need to create a CareLog account first, then enter this code.
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 border">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Invite Code</div>
                  <div className="text-2xl font-mono font-bold tracking-widest text-gray-900">{group.invite_code}</div>
                </div>
                <Button variant="outline" onClick={copyCode} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Care recipient info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Care Recipient</CardTitle>
            </CardHeader>
            <CardContent>
              {recipient ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-lg font-semibold">
                        {getInitials(recipient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{recipient.name}</div>
                      {recipient.date_of_birth && (
                        <div className="text-xs text-muted-foreground">
                          Born {format(parseISO(recipient.date_of_birth), 'MMMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>

                  {recipient.doctor_name && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Primary Doctor</div>
                      <div className="text-sm">{recipient.doctor_name}</div>
                    </div>
                  )}

                  {recipient.medical_conditions && recipient.medical_conditions.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Conditions</div>
                      <div className="flex flex-wrap gap-1">
                        {recipient.medical_conditions.map((c: string) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipient.allergies && recipient.allergies.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Allergies</div>
                      <div className="flex flex-wrap gap-1">
                        {recipient.allergies.map((a: string) => (
                          <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No care recipient set up yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Group Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Group Name</span>
                <span className="font-medium">{group.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(parseISO(group.created_at), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
