'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sun,
  ListChecks,
  LayoutList,
  Pill,
  HeartPulse,
  CalendarDays,
  NotebookPen,
  SquareCheckBig,
  FolderOpen,
  Users,
  LogOut,
  ChevronsUpDown,
  Plus,
  Check,
  Loader2,
  BriefcaseMedical,
  Ellipsis,
} from 'lucide-react'
import { cn, initials } from '@/lib/utils'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { setActiveGroup, createCareGroup, joinCareGroup } from '@/app/actions/care-group'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BrandMark } from '@/components/layout/BrandMark'

type NavItem = { href: string; label: string; icon: typeof Sun }

const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Today', icon: Sun },
      { href: '/checklist', label: 'Daily checklist', icon: ListChecks },
      { href: '/activity', label: 'Activity', icon: LayoutList },
    ],
  },
  {
    label: 'Health',
    items: [
      { href: '/medications', label: 'Medications', icon: Pill },
      { href: '/vitals', label: 'Vitals', icon: HeartPulse },
      { href: '/appointments', label: 'Appointments', icon: CalendarDays },
      { href: '/visits', label: 'Visit notes', icon: NotebookPen },
    ],
  },
  {
    label: 'Family',
    items: [
      { href: '/tasks', label: 'Tasks', icon: SquareCheckBig },
      { href: '/documents', label: 'Documents', icon: FolderOpen },
      { href: '/family', label: 'People', icon: Users },
    ],
  },
]

// The four destinations used most on a phone; everything else lives under "More".
const tabItems: NavItem[] = [
  { href: '/dashboard', label: 'Today', icon: Sun },
  { href: '/medications', label: 'Meds', icon: Pill },
  { href: '/appointments', label: 'Calendar', icon: CalendarDays },
  { href: '/visits', label: 'Notes', icon: NotebookPen },
]

interface GroupSummary {
  id: string
  name: string
  recipientName?: string
}

interface SidebarProps {
  careGroupName?: string
  recipientName?: string
  recipientDetail?: string
  activeGroupId?: string
  emergencyToken?: string
  userName?: string
  allGroups?: GroupSummary[]
}

export function Sidebar({
  careGroupName,
  recipientName,
  recipientDetail,
  activeGroupId,
  emergencyToken,
  userName,
  allGroups = [],
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  // New group form state
  const [formLoading, setFormLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [newRecipientName, setNewRecipientName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const emergencyHref = emergencyToken ? `/emergency/${emergencyToken}` : undefined
  const personName = recipientName ?? careGroupName ?? 'Select a person'

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
      toast.error('Couldn’t switch. Please try again.')
    } finally {
      setSwitching(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      await createCareGroup(groupName, newRecipientName, dateOfBirth || undefined)
      toast.success('Care group created')
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
      await joinCareGroup(inviteCodeInput)
      toast.success('Request sent. The group admin needs to approve it.')
      setAddDialogOpen(false)
      setInviteCodeInput('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setFormLoading(false)
    }
  }

  const isActive = (href: string) => pathname === href

  function renderNavLinks(onNavigate?: () => void) {
    return (
      <div className="flex flex-col gap-5">
        {navGroups.map((group, i) => (
          <div key={group.label ?? i} className="flex flex-col gap-0.5">
            {group.label && (
              <span className="px-2.5 pb-1 text-xs font-semibold text-muted-foreground">{group.label}</span>
            )}
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm transition-colors',
                  isActive(href)
                    ? 'bg-sidebar-accent font-semibold text-foreground'
                    : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('size-[18px] shrink-0', isActive(href) && 'text-primary')} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    )
  }

  function renderPersonSwitcher(compact = false) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-3 rounded-xl border border-border bg-muted/50 text-left transition-colors hover:bg-muted',
            compact ? 'min-h-11 py-1 pr-2.5 pl-1' : 'w-full p-2.5'
          )}
        >
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-[10px] bg-primary/15 font-semibold text-primary',
              compact ? 'size-9 text-xs' : 'size-10 text-sm'
            )}
            aria-hidden="true"
          >
            {initials(personName)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-semibold leading-tight">{personName}</span>
            {!compact && (recipientDetail || careGroupName) && (
              <span className="truncate text-xs text-muted-foreground">
                {[recipientDetail, careGroupName].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Switch person</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className="min-w-60">
          {allGroups.map(g => (
            <DropdownMenuItem
              key={g.id}
              onClick={() => handleSwitchGroup(g.id)}
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{g.recipientName ?? g.name}</div>
                <div className="truncate text-xs text-muted-foreground">{g.name}</div>
              </div>
              {switching === g.id ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : g.id === activeGroupId ? (
                <Check className="size-4 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
          {allGroups.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setAddDialogOpen(true)} className="cursor-pointer text-primary">
            <Plus className="mr-1.5 size-4" />
            Add someone to care for
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function renderEmergencyLink(onNavigate?: () => void) {
    if (!emergencyHref) return null
    return (
      <Link
        href={emergencyHref}
        target="_blank"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl border border-urgent-border bg-urgent p-3 transition-colors hover:border-urgent-foreground/40"
      >
        <BriefcaseMedical className="size-5 shrink-0 text-urgent-foreground" aria-hidden="true" />
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Emergency card</span>
          <span className="text-xs text-muted-foreground">Meds, allergies, contacts</span>
        </span>
      </Link>
    )
  }

  function renderAccountLinks(onNavigate?: () => void) {
    return (
      <div className="flex flex-col gap-0.5">
        <Link
          href="/profile"
          onClick={onNavigate}
          aria-current={isActive('/profile') ? 'page' : undefined}
          className={cn(
            'flex min-h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm transition-colors',
            isActive('/profile') ? 'bg-sidebar-accent font-semibold' : 'text-foreground/75 hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground/75" aria-hidden="true">
            {initials(userName)}
          </span>
          <span className="flex-1 truncate">{userName ?? 'Your profile'}</span>
          <span className="text-xs text-muted-foreground">Settings</span>
        </Link>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2.5 font-normal text-foreground/75 hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-1.5 size-4" />
          Sign out
        </Button>
      </div>
    )
  }

  const moreActive = !tabItems.some(t => isActive(t.href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3.5 py-5 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <BrandMark />
          <span className="text-base font-semibold tracking-[-0.01em]">CareLog</span>
        </Link>
        {renderPersonSwitcher()}
        <nav aria-label="Main" className="flex-1">
          {renderNavLinks()}
        </nav>
        <div className="flex flex-col gap-3">
          {renderEmergencyLink()}
          {renderAccountLinks()}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur md:hidden">
        {renderPersonSwitcher(true)}
        {emergencyHref && (
          <Link
            href={emergencyHref}
            target="_blank"
            aria-label="Emergency card"
            className="flex size-11 items-center justify-center rounded-xl border border-urgent-border bg-urgent"
          >
            <BriefcaseMedical className="size-5 text-urgent-foreground" aria-hidden="true" />
          </Link>
        )}
      </header>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {tabItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs',
              isActive(href) ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
            )}
          >
            <Icon className="size-[22px]" aria-hidden="true" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs',
            moreActive ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
          )}
        >
          <Ellipsis className="size-[22px]" aria-hidden="true" />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="w-[85%] gap-5 overflow-y-auto bg-sidebar px-3.5 py-5">
          <SheetTitle className="flex items-center gap-2.5 px-2">
            <BrandMark />
            CareLog
          </SheetTitle>
          <nav aria-label="All sections">
            {renderNavLinks(() => setMoreOpen(false))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            {renderEmergencyLink(() => setMoreOpen(false))}
            {renderAccountLinks(() => setMoreOpen(false))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add someone dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open: boolean) => setAddDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add someone to care for</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">New group</TabsTrigger>
              <TabsTrigger value="join">Join with a code</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sidebar-group-name">Group name</Label>
                  <Input
                    id="sidebar-group-name"
                    placeholder="e.g. Caring for Dad"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sidebar-recipient">Their name</Label>
                  <Input
                    id="sidebar-recipient"
                    placeholder="e.g. Robert Chen"
                    value={newRecipientName}
                    onChange={e => setNewRecipientName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sidebar-dob">
                    Date of birth <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="sidebar-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div className="flex items-start gap-2.5 rounded-[10px] border bg-muted/40 p-3">
                  <input
                    id="sidebar-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 size-4 cursor-pointer accent-primary"
                  />
                  <label htmlFor="sidebar-terms" className="cursor-pointer text-xs leading-relaxed text-muted-foreground select-none">
                    I agree to the{' '}
                    <Link href="/tos" target="_blank" className="font-medium text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">Privacy Policy</Link>
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={formLoading || !termsAccepted}>
                  {formLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create group
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-4">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sidebar-invite">Invite code</Label>
                  <Input
                    id="sidebar-invite"
                    placeholder="e.g. abc12345"
                    value={inviteCodeInput}
                    onChange={e => setInviteCodeInput(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Join group
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

