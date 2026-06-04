'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Pill, ClipboardList, CheckSquare, Calendar, Activity, LayoutList,
} from 'lucide-react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import type { ActivityItem } from '@/types'

interface Props {
  items: ActivityItem[]
}

const TYPE_CONFIG: Record<ActivityItem['type'], { label: string; icon: React.ReactNode; color: string }> = {
  medication_given:       { label: 'Medication',    icon: <Pill className="h-4 w-4" />,          color: 'bg-teal-100 text-teal-700' },
  medication_skipped:     { label: 'Skipped',       icon: <Pill className="h-4 w-4" />,          color: 'bg-red-100 text-red-700' },
  visit:                  { label: 'Visit',          icon: <ClipboardList className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  task_completed:         { label: 'Task',           icon: <CheckSquare className="h-4 w-4" />,   color: 'bg-orange-100 text-orange-700' },
  appointment_completed:  { label: 'Appointment',   icon: <Calendar className="h-4 w-4" />,      color: 'bg-emerald-100 text-emerald-700' },
  vital_recorded:         { label: 'Vital',          icon: <Activity className="h-4 w-4" />,      color: 'bg-rose-100 text-rose-700' },
}

type FilterType = ActivityItem['type'] | 'all'

function dateGroupLabel(timestamp: string): string {
  const d = parseISO(timestamp)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMMM d')
}

export function ActivityClient({ items }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [showCount, setShowCount] = useState(30)

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)
  const visible = filtered.slice(0, showCount)

  // Group visible items by date
  const groups: { label: string; items: ActivityItem[] }[] = []
  let currentLabel = ''
  for (const item of visible) {
    const label = dateGroupLabel(item.timestamp)
    if (label !== currentLabel) {
      currentLabel = label
      groups.push({ label, items: [item] })
    } else {
      groups[groups.length - 1].items.push(item)
    }
  }

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'medication_given', label: 'Medications' },
    { value: 'medication_skipped', label: 'Skipped' },
    { value: 'visit', label: 'Visits' },
    { value: 'task_completed', label: 'Tasks' },
    { value: 'appointment_completed', label: 'Appointments' },
    { value: 'vital_recorded', label: 'Vitals' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutList className="h-6 w-6 text-slate-600" />
          Activity Feed
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Everything that's happened, in order</p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filterOptions.map(opt => {
          const count = opt.value === 'all' ? items.length : items.filter(i => i.type === opt.value).length
          if (opt.value !== 'all' && count === 0) return null
          return (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setFilter(opt.value); setShowCount(30) }}
            >
              {opt.label} {opt.value !== 'all' && `(${count})`}
            </Button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <LayoutList className="h-12 w-12 text-muted-foreground/30" />
            <div className="font-medium text-muted-foreground">No activity yet</div>
            <div className="text-sm text-muted-foreground/70">Activity from medications, visits, tasks, and appointments will appear here</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.label}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.label}
                </div>
                <div className="space-y-1.5">
                  {group.items.map(item => {
                    const cfg = TYPE_CONFIG[item.type]
                    return (
                      <Card key={item.id}>
                        <CardContent className="py-2.5 px-4 flex items-start gap-3">
                          <div className={`rounded-full p-1.5 flex-shrink-0 mt-0.5 ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-snug">{item.title}</div>
                            {item.subtitle && (
                              <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                            {format(parseISO(item.timestamp), 'h:mm a')}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {filtered.length > showCount && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowCount(c => c + 30)}
            >
              Load more ({filtered.length - showCount} remaining)
            </Button>
          )}
        </>
      )}
    </div>
  )
}
