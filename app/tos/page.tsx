import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service – CareLog',
}

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last updated: June 5, 2026</p>

        <div className="space-y-10 text-foreground">

          <Section title="Acceptance of terms">
            <p>
              By creating an account or using CareLog, you agree to these Terms of Service. If you
              do not agree, do not use the service. These terms form a binding agreement between you
              and CareLog.
            </p>
          </Section>

          <Section title="What CareLog is — and is not">
            <p>
              CareLog is a personal organization and coordination tool for families managing care for
              a loved one. It is <strong>not</strong>:
            </p>
            <ul>
              <li>A medical device or clinical software.</li>
              <li>A substitute for professional medical advice, diagnosis, or treatment.</li>
              <li>A HIPAA-compliant medical record system.</li>
              <li>An emergency response service — never rely on CareLog in place of calling 911.</li>
            </ul>
            <p>
              Always consult a qualified healthcare professional for medical decisions. The information
              you store in CareLog is for your personal reference only.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You must be at least 13 years old to
              create an account. Notify us immediately at{' '}
              <a href="mailto:usmannaveed012@gmail.com" className="text-teal-600 hover:underline">
                usmannaveed012@gmail.com
              </a>{' '}
              if you suspect unauthorized access to your account.
            </p>
          </Section>

          <Section title="Your data and content">
            <p>
              You own the data you enter into CareLog. By using the service, you grant CareLog a
              limited license to store and display that data solely for the purpose of providing the
              service to you.
            </p>
            <p>
              You are responsible for the accuracy of the information you enter, including medication
              names, dosages, and emergency contact details. CareLog does not verify or validate any
              medical information.
            </p>
          </Section>

          <Section title="Emergency info page">
            <p>
              CareLog provides a public emergency info page accessible via your group invite code.
              By entering information in the care recipient profile, you consent to that information
              being publicly accessible at that URL. You are responsible for the content you choose
              to display on this page. Do not include information you wish to keep private.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>Use CareLog for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to other users&apos; data.</li>
              <li>Upload malicious files or attempt to disrupt the service.</li>
              <li>Use CareLog to store or distribute information that violates the rights of others.</li>
            </ul>
          </Section>

          <Section title="Service availability">
            <p>
              CareLog is provided as-is. We make reasonable efforts to keep the service available,
              but we do not guarantee uninterrupted access. The service may be modified, suspended,
              or discontinued at any time with reasonable notice where possible.
            </p>
          </Section>

          <Section title="Disclaimer of warranties">
            <p>
              CareLog is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express
              or implied. We do not warrant that the service will be error-free, that data will never
              be lost, or that the information stored in CareLog is accurate or complete.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by applicable law, CareLog and its operators shall not
              be liable for any indirect, incidental, special, or consequential damages arising from
              your use of the service, including but not limited to loss of data, personal injury, or
              medical harm resulting from reliance on information stored in CareLog.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms from time to time. Material changes will be reflected by an
              updated date at the top of this page. Continued use of CareLog after changes are
              posted constitutes your acceptance of the revised terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms? Contact us at{' '}
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
