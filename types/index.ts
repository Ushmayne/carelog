export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  phone_number?: string
  created_at: string
}

export interface CareGroup {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  care_recipient?: CareRecipient
}

export interface CareRecipient {
  id: string
  care_group_id: string
  name: string
  date_of_birth?: string
  medical_conditions?: string[]
  allergies?: string[]
  doctor_name?: string
  doctor_phone?: string
  emergency_contact?: string
  notes?: string
  created_at: string
}

export interface GroupMember {
  id: string
  care_group_id: string
  user_id: string
  role: 'admin' | 'member'
  status: 'pending' | 'approved'
  joined_at: string
  profile?: Profile
}

export interface Medication {
  id: string
  care_group_id: string
  name: string
  dosage: string
  frequency: string
  instructions?: string
  prescribing_doctor?: string
  active: boolean
  scheduled_times?: string[]
  created_by: string
  created_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  care_group_id: string
  administered_by: string
  administered_at: string
  notes?: string
  skipped: boolean
  skip_reason?: string
  created_at: string
  medication?: Medication
  profile?: Profile
}

export interface Appointment {
  id: string
  care_group_id: string
  title: string
  doctor_name?: string
  location?: string
  appointment_date: string
  notes?: string
  outcome?: string
  status: 'upcoming' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  creator?: Profile
}

export interface VisitNote {
  id: string
  care_group_id: string
  visited_by: string
  visit_date: string
  duration_minutes?: number
  mood?: 'good' | 'fair' | 'poor'
  notes: string
  created_at: string
  visitor?: Profile
}

export interface ChecklistItem {
  id: string
  care_group_id: string
  title: string
  description?: string
  order_index: number
  created_by: string
  created_at: string
}

export interface ChecklistCompletion {
  id: string
  checklist_item_id: string
  care_group_id: string
  completed_by: string
  completed_date: string
  notes?: string
  created_at: string
  completer?: { full_name: string }
}

export interface Task {
  id: string
  care_group_id: string
  title: string
  description?: string
  assigned_to?: string
  created_by: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed_at?: string
  recurrence?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  recurrence_ends_at?: string | null
  parent_task_id?: string | null
  created_at: string
  assignee?: Profile
  creator?: Profile
}

export interface VitalReading {
  id: string
  care_group_id: string
  type: 'blood_pressure' | 'heart_rate' | 'weight' | 'blood_sugar' | 'temperature' | 'oxygen_saturation'
  value: string
  unit: string
  notes?: string
  recorded_by: string
  recorded_at: string
  created_at: string
  recorder?: Pick<Profile, 'full_name'>
}

export interface CareDocument {
  id: string
  care_group_id: string
  name: string
  description?: string
  category: 'medical_record' | 'insurance' | 'prescription' | 'test_result' | 'other'
  file_url: string
  file_name: string
  file_type: string
  file_size?: number
  uploaded_by: string
  created_at: string
  uploader?: Pick<Profile, 'full_name'>
}

export interface ActivityItem {
  id: string
  type: 'medication_given' | 'medication_skipped' | 'visit' | 'task_completed' | 'appointment_completed' | 'vital_recorded'
  title: string
  subtitle: string
  timestamp: string
}
