import Link from 'next/link'
import { Heart, Pill, Calendar, ClipboardList, CheckSquare, Users, ArrowRight, Shield } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-xl p-1.5">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareLog</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Sign In
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Shield className="h-3.5 w-3.5" />
            Built for families
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Care coordination,{' '}
            <span className="text-blue-600">simplified</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            CareLog keeps your whole family on the same page — medications, appointments, visit notes, and tasks, all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'flex items-center gap-2')}>
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Everything your family needs</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            One hub to replace scattered texts, sticky notes, and missed medication reminders.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Pill className="h-6 w-6 text-blue-600" />}
              bg="bg-blue-50"
              title="Medication Tracking"
              description="Log every dose, skip, or note. See a full history at a glance so nothing slips through."
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6 text-emerald-600" />}
              bg="bg-emerald-50"
              title="Appointment Management"
              description="Add upcoming doctor visits, track follow-ups, and keep the whole family informed."
            />
            <FeatureCard
              icon={<ClipboardList className="h-6 w-6 text-purple-600" />}
              bg="bg-purple-50"
              title="Visit Notes"
              description="Record how each visit went — mood, notes, observations — so everyone stays in the loop."
            />
            <FeatureCard
              icon={<CheckSquare className="h-6 w-6 text-orange-600" />}
              bg="bg-orange-50"
              title="Shared Task List"
              description="Assign tasks to family members with due dates and priorities. No more dropped balls."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-pink-600" />}
              bg="bg-pink-50"
              title="Family Groups"
              description="Invite siblings, spouses, and other caregivers with a simple code. Everyone sees the same picture."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6 text-red-500" />}
              bg="bg-red-50"
              title="Care-Centered Design"
              description="Built specifically for families coordinating care — not a generic task app with a new coat of paint."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get organized?</h2>
          <p className="text-blue-200 mb-8">
            Set up your care group in minutes and invite your family today.
          </p>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'inline-flex items-center gap-2')}
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="bg-blue-600 rounded-lg p-1">
              <Heart className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">CareLog</span>
          </div>
          <p className="text-xs text-gray-400">Helping families care together.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon, bg, title, description,
}: {
  icon: React.ReactNode
  bg: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className={`${bg} rounded-xl p-3 h-fit flex-shrink-0`}>{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
