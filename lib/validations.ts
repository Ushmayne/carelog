import { z } from 'zod'

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
  file_url: z.string().url('Invalid file URL'),
  file_name: z.string().min(1).max(300),
  file_type: z.string().min(1).max(100),
  file_size: z.number().positive().optional(),
})

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
  }
  return result.data
}
