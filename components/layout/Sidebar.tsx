'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Heart,
  LayoutDashboard,
  Pill,
  Calendar,
  ClipboardList,
  CheckSquare,
  Users,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  UserCircle,
  ChevronDown,
  Plus,
  Check,
  Loader2,
  Activity,
  FolderOpen,
  LayoutList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { setActiveGroup, createCareGroup, joinCareGroup } from '@/app/actions/care-group'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activity', label: 'Activity', icon: LayoutList },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/vitals', label: 'Vitals', icon: Activity },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/visits', label: 'Visit Notes', icon: ClipboardList },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/checklist', label: 'Daily Checklist', icon: ClipboardCheck },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/family', label: 'Family', icon: Users },
]

interface GroupSummary {
  id: string
  name: string
  recipientName?: string
}

interface SidebarProps {
  careGroupName?: string
  recipientName?: string
  activeGroupId?: string
  allGroups?: GroupSummary[]
}

export function Sidebar({ careGroupName, recipientName, activeGroupId, allGroups = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  // New group form state
  const [formLoading, setFormLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [newRecipientName, setNewRecipientName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  async function handleSwitchGroup(groupId: string) {
    if (groupId === activeGroupId || switching) return
    setSwitching(groupId)
    try {
      await setActiveGroup(groupId)
      router.refresh()
    } catch {
      toast.error('Failed to switch')
    } finally {
      setSwitching(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      await createCareGroup(groupName, newRecipientName, dateOfBirth || undefined)
      toast.success('Care group created!')
      setAddDialogOpen(false)
      setGroupName('')
      setNewRecipientName('')
      setDateOfBirth('')
      setTermsAccepted(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      await joinCareGroup(inviteCode)
      toast.success('Request sent! The group admin will need to approve your membership.')
      setAddDialogOpen(false)
      setInviteCode('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setFormLoading(false)
    }
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === href
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {pathname === href && (
              <span className="absolute left-0 inset-y-1.5 w-[3px] bg-teal-600 rounded-r-full" />
            )}
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </>
    )
  }

  function SidebarHeader() {
    return (
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-teal-600 rounded-lg p-1.5">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div className="font-bold text-sm text-foreground">CareLog</div>
        </div>

        {allGroups.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent text-left text-sm font-medium transition-colors">
              <span className="truncate text-foreground">{careGroupName ?? 'Select group'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              {allGroups.map(g => (
                <DropdownMenuItem
                  key={g.id}
                  onClick={() => handleSwitchGroup(g.id)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{g.name}</div>
                    {g.recipientName && (
                      <div className="text-xs text-muted-foreground">Caring for {g.recipientName}</div>
                    )}
                  </div>
                  {switching === g.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0 text-muted-foreground" />
                    : g.id === activeGroupId
                      ? <Check className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                      : null
                  }
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAddDialogOpen(true)}
                className="cursor-pointer text-teal-600"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add family member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {recipientName && (
          <div className="mt-2 px-2 py-1.5 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <div className="text-xs text-muted-foreground">Caring for</div>
            <div className="text-sm font-medium text-teal-800 dark:text-teal-200">{recipientName}</div>
          </div>
        )}
      </div>
    )
  }

  function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/profile"
          onClick={onNavigate}
          className={cn(
            'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            pathname === '/profile'
              ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {pathname === '/profile' && (
            <span className="absolute left-0 inset-y-1.5 w-[3px] bg-teal-600 rounded-r-full" />
          )}
          <UserCircle className="h-4 w-4 flex-shrink-0" />
          Profile
        </Link>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card h-screen sticky top-0">
        <SidebarHeader />
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks />
        </nav>
        <SidebarFooter />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 rounded-lg p-1.5">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">CareLog</span>
          {careGroupName && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{careGroupName}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-card h-full shadow-xl flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarHeader />
            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <SidebarFooter onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Add family member dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open: boolean) => setAddDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a family member</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">New group</TabsTrigger>
              <TabsTrigger value="join">Join group</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Group Name</Label>
                  <Input
                    placeholder="e.g. Caring for Dad"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Family Member&apos;s Name</Label>
                  <Input
                    placeholder="e.g. Dad, Robert"
                    value={newRecipientName}
                    onChange={e => setNewRecipientName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Date of Birth{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border p-3 bg-muted/30">
                  <input
                    id="sidebar-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-teal-600"
                  />
                  <label htmlFor="sidebar-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                    I agree to the{' '}
                    <Link href="/tos" target="_blank" className="text-teal-600 hover:underline font-medium">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={formLoading || !termsAccepted}>
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-4">
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Invite Code</Label>
                  <Input
                    placeholder="e.g. abc12345"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Join Group
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
