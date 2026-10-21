import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { BrandMark } from '@/components/layout/BrandMark'
import { cn } from '@/lib/utils'

const questions = [
  {
    q: '“Did Mom take her pills?”',
    a: 'Every dose is logged with the time and who gave it. A missed one shows up on everyone’s Today screen.',
  },
  {
    q: '“When’s the cardiology appointment?”',
    a: 'Appointments keep the doctor, the address, the time and the notes in one place the whole family can see.',
  },
  {
    q: '“How was she when you visited?”',
    a: 'Short visit notes with mood, so a sibling three time zones away still knows how her week went.',
  },
  {
    q: '“What do I tell the paramedics?”',
    a: 'An emergency card with her medications, allergies and contacts, one tap from any screen.',
  },
]

const sampleDoses = [
  { time: '8:00 AM', name: 'Metformin 500 mg', status: 'Given · Sara', state: 'done' },
  { time: '8:00 AM', name: 'Lisinopril 10 mg', status: 'Given · Sara', state: 'done' },
  { time: '12:00 PM', name: 'Vitamin D3', status: 'Not logged', state: 'missed' },
  { time: '6:00 PM', name: 'Metformin 500 mg', status: 'Due in 2 hr', state: 'later' },
] as const

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.01em]">CareLog</span>
        </Link>
        <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
          <Link href="#how" className="hidden rounded-lg px-3 py-2 text-foreground/75 hover:text-foreground sm:block">How it works</Link>
          <Link href="/privacy" className="hidden rounded-lg px-3 py-2 text-foreground/75 hover:text-foreground sm:block">Privacy</Link>
          <Link href="/login" className="rounded-lg px-3 py-2 font-semibold">Sign in</Link>
          <Link href="/signup" className={cn(buttonVariants(), 'bg-foreground text-background hover:bg-foreground/90')}>
            Start a care group
          </Link>
        </nav>
      </header>

      <main id="content" className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-14 px-4 pt-10 pb-24 md:px-6 md:pt-16">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <h1 className="text-[clamp(2.5rem,5.2vw,4rem)] leading-[1.04] font-semibold tracking-[-0.035em]">
              Everyone looking after Mom, on the same page.
            </h1>
            <p className="max-w-[34ch] text-lg text-foreground/80 md:text-[19px]">
              A shared log for families caring for an aging parent: who gave which pill, what the doctor said, and what still needs doing.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-5">
              <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
                Start a care group, free
              </Link>
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                I have an invite code
              </Link>
            </div>
          </div>

          <figure className="relative min-w-0 flex-[1_1_440px] pb-10">
            <div className="flex flex-col rounded-[20px] border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgba(21,48,40,0.22)]">
              <div className="flex items-baseline justify-between pb-2.5">
                <span className="text-[17px] font-semibold">Today’s medications</span>
                <span className="text-sm text-muted-foreground">Tuesday</span>
              </div>
              {sampleDoses.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-[15px]',
                    d.state === 'missed' ? '-mx-2.5 rounded-[10px] bg-attention px-2.5' : 'border-t border-border'
                  )}
                >
                  <span className={cn('tabular-nums', d.state === 'missed' ? 'font-semibold text-attention-foreground' : d.state === 'done' ? 'text-muted-foreground' : 'font-semibold')}>
                    {d.time}
                  </span>
                  <span className="truncate font-semibold">{d.name}</span>
                  <span className={cn('text-sm', d.state === 'missed' ? 'font-semibold text-attention-foreground' : 'text-foreground/75')}>{d.status}</span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-4 flex w-64 flex-col gap-1.5 rounded-2xl border border-border bg-card p-3.5 shadow-[0_16px_40px_-20px_rgba(21,48,40,0.25)] md:-left-7">
              <span className="text-[13px] text-muted-foreground">Imran · yesterday</span>
              <span className="text-[15px] text-foreground/90">“Her knee hurts on the stairs again. Ask Dr. Patel Thursday.”</span>
            </div>
            <figcaption className="sr-only">An example CareLog Today screen showing medication doses and a family note</figcaption>
          </figure>
        </section>

        <section id="how" className="border-y border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-12 px-4 py-20 md:px-6">
            <h2 className="flex-[1_1_280px] text-[34px] leading-[1.12] font-semibold tracking-[-0.025em]">
              Built around the questions families text each other every day
            </h2>
            <dl className="grid flex-[2_1_520px] gap-x-10 gap-y-9 sm:grid-cols-2">
              {questions.map(({ q, a }) => (
                <div key={q} className="flex flex-col gap-1.5 border-t-2 border-foreground pt-4">
                  <dt className="text-lg font-semibold">{q}</dt>
                  <dd className="text-foreground/75">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-18 md:px-6">
          <p className="max-w-[30ch] text-[26px] font-semibold tracking-[-0.02em]">
            Set up a care group in two minutes, then send your family the invite code.
          </p>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'bg-foreground text-background hover:bg-foreground/90')}>
            Start a care group
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:px-6">
          <span>CareLog</span>
          <span className="flex gap-5">
            <Link href="/privacy" className="hover:text-foreground">Privacy policy</Link>
            <Link href="/tos" className="hover:text-foreground">Terms of service</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
