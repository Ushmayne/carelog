import { createAdminClient } from '@/lib/supabase/server'
import { format, parseISO, differenceInYears } from 'date-fns'
import { Phone, AlertTriangle, Pill, Stethoscope, Heart } from 'lucide-react'

interface Props {
  params: Promise<{ code: string }>
}

export default async function EmergencyPage({ params }: Props) {
  const { code } = await params
  const supabase = createAdminClient()

  const { data: group } = await supabase
    .from('care_groups')
    .select('id, name')
    .eq('invite_code', code.toLowerCase())
    .maybeSingle()

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">This emergency info link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const [recipientRes, medsRes] = await Promise.all([
    supabase
      .from('care_recipients')
      .select('*')
      .eq('care_group_id', group.id)
      .maybeSingle(),
    supabase
      .from('medications')
      .select('name, dosage, frequency, instructions, prescribing_doctor')
      .eq('care_group_id', group.id)
      .eq('active', true),
  ])

  const recipient = recipientRes.data
  const medications = medsRes.data ?? []

  const age = recipient?.date_of_birth
    ? differenceInYears(new Date(), parseISO(recipient.date_of_birth))
    : null

  return (
    <div className="min-h-screen bg-white">
      {/* Emergency banner */}
      <div className="bg-red-600 text-white px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold text-lg uppercase tracking-wide">Emergency Medical Info</span>
        </div>
        <p className="text-red-100 text-sm">Show this page to emergency responders</p>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* Patient identity */}
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-5 w-5 text-red-600" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Patient</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{recipient?.name ?? group.name}</h1>
          {age !== null && (
            <p className="text-gray-600 mt-1 text-lg">
              Age {age}
              {recipient?.date_of_birth && ` · DOB ${format(parseISO(recipient.date_of_birth), 'MMMM d, yyyy')}`}
            </p>
          )}
        </div>

        {/* Allergies — most critical, shown first */}
        {recipient?.allergies && recipient.allergies.length > 0 && (
          <Section title="⚠️ Allergies" urgent>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipient.allergies.map((a: string) => (
                <span key={a} className="bg-red-100 text-red-800 font-semibold px-3 py-1.5 rounded-lg text-sm">
                  {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Medical conditions */}
        {recipient?.medical_conditions && recipient.medical_conditions.length > 0 && (
          <Section title="Medical Conditions">
            <div className="flex flex-wrap gap-2 mt-2">
              {recipient.medical_conditions.map((c: string) => (
                <span key={c} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Active medications */}
        {medications.length > 0 && (
          <Section title="Current Medications" icon={<Pill className="h-5 w-5 text-teal-600" />}>
            <div className="space-y-2 mt-2">
              {medications.map((med, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-base">{med.name}</span>
                    <span className="text-gray-500 text-sm">{med.dosage}</span>
                  </div>
                  <div className="text-gray-600 text-sm mt-0.5">{med.frequency}</div>
                  {med.instructions && <div className="text-gray-500 text-xs mt-0.5 italic">{med.instructions}</div>}
                  {med.prescribing_doctor && <div className="text-gray-500 text-xs mt-0.5">Dr. {med.prescribing_doctor}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Doctor */}
        {(recipient?.doctor_name || recipient?.doctor_phone) && (
          <Section title="Primary Doctor" icon={<Stethoscope className="h-5 w-5 text-emerald-600" />}>
            {recipient.doctor_name && <p className="font-semibold text-lg mt-1">{recipient.doctor_name}</p>}
            {recipient.doctor_phone && (
              <a href={`tel:${recipient.doctor_phone}`} className="flex items-center gap-2 text-blue-600 font-medium mt-1">
                <Phone className="h-4 w-4" />
                {recipient.doctor_phone}
              </a>
            )}
          </Section>
        )}

        {/* Emergency contact */}
        {recipient?.emergency_contact && (
          <Section title="Emergency Contact" icon={<Phone className="h-5 w-5 text-orange-600" />} urgent>
            <p className="text-lg font-semibold mt-1">{recipient.emergency_contact}</p>
          </Section>
        )}

        {/* Notes */}
        {recipient?.notes && (
          <Section title="Notes">
            <p className="text-gray-700 mt-1 text-sm leading-relaxed">{recipient.notes}</p>
          </Section>
        )}

        <p className="text-center text-xs text-gray-400 pt-2">
          CareLog · {group.name}
        </p>
      </div>
    </div>
  )
}

function Section({ title, children, urgent, icon }: {
  title: string
  children: React.ReactNode
  urgent?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border p-5 ${urgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className={`font-bold text-base ${urgent ? 'text-red-800' : 'text-gray-800'}`}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
