import { z } from 'zod'

// Shared by the upload form and the server check.
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const

export const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  doctor_name: z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  appointment_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(2000).optional(),
})

export const vitalSchema = z.object({
  type: z.enum(['blood_pressure', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'oxygen_saturation']),
  value: z.string().min(1, 'Value is required').max(50),
  unit: z.string().min(1, 'Unit is required').max(20),
  notes: z.string().max(1000).optional(),
  recorded_at: z.string().min(1, 'Date is required'),
})

export const medicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  dosage: z.string().min(1, 'Dosage is required').max(100),
  frequency: z.string().min(1, 'Frequency is required').max(100),
  instructions: z.string().max(1000).optional(),
  prescribing_doctor: z.string().max(200).optional(),
  scheduled_times: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')).optional(),
})

export const logMedicationSchema = z.object({
  medication_id: z.string().uuid('Invalid medication'),
  administered_at: z.string().min(1, 'Date is required'),
  notes: z.string().max(1000).optional(),
  skipped: z.boolean().optional(),
  skip_reason: z.string().max(500).optional(),
})

export const visitNoteSchema = z.object({
  visit_date: z.string().min(1, 'Date is required'),
  duration_minutes: z.number().int().min(0).max(1440).optional(),
  mood: z.enum(['good', 'fair', 'poor']).optional(),
  notes: z.string().min(1, 'Notes are required').max(5000),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  recurrence: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).nullable().optional(),
  recurrence_ends_at: z.string().nullable().optional(),
})

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  phoneNumber: z.string().max(30).optional(),
})

export const careGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200),
  recipientName: z.string().min(1, 'Care recipient name is required').max(200),
  dateOfBirth: z.string().optional(),
})

export const documentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().max(1000).optional(),
  category: z.enum(['medical_record', 'insurance', 'prescription', 'test_result', 'other']),
  // "<care group uuid>/<random uuid>.<ext>", as built by the upload form
  file_path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}(\.[a-z0-9]{1,8})?$/, 'Invalid file path'),
  file_name: z.string().min(1).max(300),
  file_type: z.enum(DOCUMENT_MIME_TYPES),
  file_size: z.number().int().positive().max(MAX_DOCUMENT_BYTES).optional(),
})

const optionalText = (max: number) => z.string().trim().max(max).optional()

// Only these fields can be changed on a care recipient.
export const careRecipientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').optional(),
  emergency_contact: optionalText(200),
  emergency_contact_phone: optionalText(30),
  allergies: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  medical_conditions: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  doctor_name: optionalText(200),
  doctor_phone: optionalText(30),
  notes: optionalText(2000),
}).strict()

export const inviteCodeSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]{6,16}$/, 'Invalid invite code')

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
  }
  return result.data
}
