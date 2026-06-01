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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/visits', label: 'Visit Notes', icon: ClipboardList },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/family', label: 'Family', icon: Users },
]

interface SidebarProps {
  careGroupName?: string
  recipientName?: string
}

export function Sidebar({ careGroupName, recipientName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">CareLog</div>
            {careGroupName && (
              <div className="text-xs text-muted-foreground truncate max-w-[140px]">{careGroupName}</div>
            )}
          </div>
        </div>
        {recipientName && (
          <div className="mt-3 px-2 py-1.5 bg-blue-50 rounded-lg">
            <div className="text-xs text-muted-foreground">Caring for</div>
            <div className="text-sm font-medium text-blue-800">{recipientName}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
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
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile header bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">CareLog</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-card h-full shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
