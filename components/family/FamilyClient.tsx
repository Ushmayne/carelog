'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Copy, Check, Crown, UserX, UserCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { approveGroupMember, removeGroupMember } from '@/app/actions/care-group'
import type { CareGroup, GroupMember, CareRecipient } from '@/types'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  group: CareGroup & { care_recipient?: any }
  members: GroupMember[]
  currentUserId: string
  currentUserRole: 'admin' | 'member'
}

export function FamilyClient({ group, members, currentUserId, currentUserRole }: Props) {
  const [copied, setCopied] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const rawRecipient = Array.isArray(group.care_recipient) ? group.care_recipient[0] : group.care_recipient
  const recipient = rawRecipient as CareRecipient | undefined

  const approvedMembers = members.filter(m => m.status === 'approved')
  const pendingMembers = members.filter(m => m.status === 'pending')

  async function copyCode() {
    await navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    toast.success('Invite code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleApprove(memberId: string) {
    setActionInProgress(memberId)
    try {
      await approveGroupMember(memberId)
      toast.success('Member approved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve member')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from this group?`)) return
    setActionInProgress(memberId)
    try {
      await removeGroupMember(memberId)
      toast.success(`${name} has been removed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setActionInProgress(null)
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-teal-600" />
          Family Members
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{approvedMembers.length} member{approvedMembers.length !== 1 ? 's' : ''} in {group.name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Pending requests — admin only */}
          {currentUserRole === 'admin' && pendingMembers.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                  Pending Requests
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">{pendingMembers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                        {getInitials(member.profile?.full_name ?? 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{member.profile?.full_name ?? 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{member.profile?.email}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        Requested {format(parseISO(member.joined_at), 'MMM d')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                        disabled={actionInProgress === member.id}
                        onClick={() => handleApprove(member.id)}
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionInProgress === member.id}
                        onClick={() => handleRemove(member.id, member.profile?.full_name ?? 'this member')}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Members list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvedMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-semibold">
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.role === 'admin' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Crown className="h-3 w-3" />Admin
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Joined {format(parseISO(member.joined_at), 'MMM d')}
                    </div>
                    {currentUserRole === 'admin' && member.user_id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        disabled={actionInProgress === member.id}
                        onClick={() => handleRemove(member.id, member.profile?.full_name ?? 'this member')}
                        title="Remove member"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
                Their request will need to be approved before they can access the group.
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
                <span className="font-medium">{approvedMembers.length}</span>
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
