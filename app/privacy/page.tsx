import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy – CareLog',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-teal-600 rounded-xl p-1.5">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">CareLog</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: June 5, 2026</p>

        <div className="prose prose-neutral max-w-none space-y-10 text-foreground">

          <Section title="Overview">
            <p>
              CareLog is a family care coordination tool. We take your privacy seriously, especially
              because the information you store here — medications, vitals, medical notes — is sensitive.
              This policy explains what we collect, how we use it, and what rights you have over it.
            </p>
          </Section>

          <Section title="What we collect">
            <p>When you create an account and use CareLog, we collect:</p>
            <ul>
              <li><strong>Account information</strong> — your name, email address, and password (stored as a secure hash).</li>
              <li><strong>Profile information</strong> — optional phone number and profile picture you choose to upload.</li>
              <li><strong>Care data</strong> — information you enter about your care recipient, including medications, appointments, visit notes, vitals, tasks, documents, and daily checklists.</li>
              <li><strong>Care recipient data</strong> — name, date of birth, allergies, medical conditions, doctor details, and emergency contacts you enter.</li>
              <li><strong>Usage data</strong> — basic logs of actions taken within the app (e.g., medication logged, task completed) to power the activity feed.</li>
            </ul>
            <p>We do not use tracking cookies, third-party analytics, or advertising pixels.</p>
          </Section>

          <Section title="How we use your data">
            <p>Your data is used solely to provide the CareLog service:</p>
            <ul>
              <li>Displaying your care information within your family group.</li>
              <li>Generating the public emergency info page accessible via your group invite code.</li>
              <li>Sending transactional emails (account confirmation, password reset) via Supabase Auth.</li>
            </ul>
            <p>We do not sell, rent, or share your data with any third parties for marketing purposes.</p>
          </Section>

          <Section title="Emergency info page">
            <p>
              CareLog generates a public emergency info page at{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">/emergency/[your-invite-code]</code>.
              This page is intentionally accessible without a login so it can be shown to emergency
              responders. It displays your care recipient&apos;s name, allergies, active medications,
              doctor, and emergency contact.
            </p>
            <p>
              You control what appears on this page by what you enter in the care recipient profile.
              If you do not want this page to be public, do not enter sensitive information in the
              care recipient section, or leave that section blank.
            </p>
          </Section>

          <Section title="Data storage and security">
            <p>
              All data is stored in a PostgreSQL database managed by Supabase and hosted on AWS
              infrastructure. Data is encrypted at rest and in transit using TLS. Access to your
              data is protected by Row Level Security (RLS) policies — meaning database queries are
              scoped to your account and care group automatically at the database level.
            </p>
          </Section>

          <Section title="Not a HIPAA-covered service">
            <p>
              CareLog is a personal coordination tool for families, not a covered entity or business
              associate under HIPAA. It is not intended for use by healthcare providers as a medical
              record system. Do not use CareLog as a substitute for official medical records.
            </p>
          </Section>

          <Section title="Data retention and deletion">
            <p>
              Your data is retained for as long as your account exists. You can delete your account
              and all associated data at any time by contacting us at the email below. We will
              process deletion requests within 30 days.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              CareLog is not directed at children under 13. We do not knowingly collect personal
              information from anyone under 13. If you believe a child under 13 has created an
              account, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we make material changes to this policy, we will update the date at the top of this
              page. Continued use of CareLog after changes are posted constitutes acceptance of the
              updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Email us at{' '}
              <a href="mailto:usmannaveed012@gmail.com" className="text-teal-600 hover:underline">
                usmannaveed012@gmail.com
              </a>
              .
            </p>
          </Section>

        </div>
      </main>

      <footer className="border-t border-border py-6 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-muted-foreground">© 2026 CareLog. Helping families care together.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/tos" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-teal-600 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  )
}
