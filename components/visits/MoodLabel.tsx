import { cn } from '@/lib/utils'
import type { VisitNote } from '@/types'

type Mood = NonNullable<VisitNote['mood']>

const moodStyles: Record<Mood, { label: string; chip: string; dot: string }> = {
  good: { label: 'good', chip: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  fair: { label: 'fair', chip: 'bg-attention text-attention-foreground', dot: 'bg-attention-strong' },
  poor: { label: 'poor', chip: 'bg-urgent text-urgent-foreground', dot: 'bg-destructive' },
}

export function MoodLabel({ mood, className }: { mood: Mood; className?: string }) {
  const s = moodStyles[mood]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', s.chip, className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      Mood: {s.label}
    </span>
  )
}
