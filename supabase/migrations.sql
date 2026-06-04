-- Run this entire file in your Supabase SQL Editor
-- Project: CareLog — Feature Additions

-- 1. Medication scheduled times
ALTER TABLE medications ADD COLUMN IF NOT EXISTS scheduled_times text[];

-- 2. Vitals tracking
CREATE TABLE IF NOT EXISTS vital_readings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  care_group_id uuid        NOT NULL REFERENCES care_groups(id) ON DELETE CASCADE,
  type          text        NOT NULL,
  value         text        NOT NULL,
  unit          text        NOT NULL,
  notes         text,
  recorded_by   uuid        NOT NULL REFERENCES profiles(id),
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vital_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vital_readings_group_access" ON vital_readings;
CREATE POLICY "vital_readings_group_access" ON vital_readings
  FOR ALL USING (
    care_group_id IN (
      SELECT care_group_id FROM group_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- 3. Document storage (metadata only — files live in Supabase Storage bucket "care-documents")
CREATE TABLE IF NOT EXISTS documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  care_group_id uuid        NOT NULL REFERENCES care_groups(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  category      text        NOT NULL DEFAULT 'other',
  file_url      text        NOT NULL,
  file_name     text        NOT NULL,
  file_type     text        NOT NULL,
  file_size     integer,
  uploaded_by   uuid        NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_group_access" ON documents;
CREATE POLICY "documents_group_access" ON documents
  FOR ALL USING (
    care_group_id IN (
      SELECT care_group_id FROM group_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- 4. Recurring tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_ends_at date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- SUPABASE STORAGE: Create a bucket named "care-documents" in your
-- Supabase dashboard (Storage → New bucket).
-- Set it to PRIVATE and add this policy so group members can upload/read:
--
-- Bucket policy (Storage → care-documents → Policies → New policy):
--   SELECT: ((storage.foldername(name))[1] IN (
--     SELECT care_group_id::text FROM group_members
--     WHERE user_id = auth.uid() AND status = 'approved'
--   ))
--   INSERT: same condition
--   DELETE: same condition
-- ──────────────────────────────────────────────────────────────────────────────
