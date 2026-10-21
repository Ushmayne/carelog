import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn('inline-block size-7 shrink-0', className)} aria-hidden="true">
      <rect width="28" height="28" rx="8" className="fill-primary" />
      <path d="M8 10h12M8 14h12M8 18h7" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
