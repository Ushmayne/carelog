-- CareLog security fixes. Run in the Supabase SQL Editor AFTER migrations.sql.
-- Safe to run more than once.
--
-- What it does:
--   1. Replaces the row-level security rules on every app table with one known set:
--      approved group members can see their group's data, and nobody else can.
--   2. Stops logged-out visitors (the "anon" role) from reading any table.
--   3. Gives each group a separate, long emergency-page token.
--   4. Makes the care-documents bucket private and limits uploads to group members.

begin;

-- ── 1. Helper: the groups the signed-in user is an approved member of ──────────
-- SECURITY DEFINER so policies on group_members can use it without recursing.
create or replace function public.approved_group_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select care_group_id from public.group_members
  where user_id = auth.uid() and status = 'approved'
$$;
revoke all on function public.approved_group_ids() from public, anon;
grant execute on function public.approved_group_ids() to authenticated;

-- ── 2. Drop the old policies so only the ones below apply ──────────────────────
-- Profile INSERT policies are kept in case the signup trigger relies on one.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','care_groups','group_members','care_recipients',
                        'medications','medication_logs','tasks','appointments','visit_notes',
                        'vital_readings','documents','checklist_items','checklist_completions')
      and not (tablename = 'profiles' and cmd = 'INSERT')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.profiles              enable row level security;
alter table public.care_groups           enable row level security;
alter table public.group_members         enable row level security;
alter table public.care_recipients       enable row level security;
alter table public.medications           enable row level security;
alter table public.medication_logs       enable row level security;
alter table public.tasks                 enable row level security;
alter table public.appointments          enable row level security;
alter table public.visit_notes           enable row level security;
alter table public.vital_readings        enable row level security;
alter table public.documents             enable row level security;
alter table public.checklist_items       enable row level security;
alter table public.checklist_completions enable row level security;

-- ── 3. New policies ─────────────────────────────────────────────────────────────
-- Group setup, joining, approvals, recipient edits and profile edits all go through
-- server code with the service role, so users only need to READ these tables.

-- Your own profile, plus people in your groups (including pending requests you may approve).
create policy "profiles_read_self_and_group" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or id in (
      select gm.user_id from public.group_members gm
      where gm.care_group_id in (select public.approved_group_ids())
    )
  );

create policy "care_groups_read_members" on public.care_groups
  for select to authenticated
  using (id in (select public.approved_group_ids()));

create policy "group_members_read" on public.group_members
  for select to authenticated
  using (user_id = auth.uid() or care_group_id in (select public.approved_group_ids()));

create policy "care_recipients_read_members" on public.care_recipients
  for select to authenticated
  using (care_group_id in (select public.approved_group_ids()));

-- Day-to-day care data: approved members can read and write their group's rows only.
do $$
declare t text;
begin
  foreach t in array array['medications','medication_logs','tasks','appointments','visit_notes',
                           'vital_readings','documents','checklist_items','checklist_completions']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (care_group_id in (select public.approved_group_ids()))
         with check (care_group_id in (select public.approved_group_ids()))',
      t || '_group_members', t);
  end loop;
end $$;

-- ── 4. Logged-out visitors get nothing from the database ───────────────────────
-- (The emergency page reads on the server with the service role.)
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- ── 5. Separate emergency-page token ────────────────────────────────────────────
alter table public.care_groups add column if not exists emergency_token text;
update public.care_groups
  set emergency_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  where emergency_token is null;
alter table public.care_groups
  alter column emergency_token set default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  alter column emergency_token set not null;
create unique index if not exists care_groups_emergency_token_key on public.care_groups (emergency_token);
create unique index if not exists care_groups_invite_code_key on public.care_groups (invite_code);

-- ── 6. Documents: private bucket, store paths instead of public URLs ────────────
update public.documents
  set file_url = split_part(file_url, '/care-documents/', 2)
  where file_url like 'http%/care-documents/%';

update storage.buckets
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = array[
        'application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'
      ]
  where id = 'care-documents';

update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id = 'avatars';

-- Drop old storage policies for this bucket, and any catch-all ones.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%care-documents%'
        or coalesce(with_check, '') ilike '%care-documents%'
        or coalesce(qual, 'true') = 'true'
      )
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

-- Members can upload into, and read, their own group's folder: "<care_group_id>/<file>".
-- Viewing in the app uses short-lived signed links made on the server.
create policy "care_documents_member_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'care-documents'
    and (storage.foldername(name))[1] in (select g::text from public.approved_group_ids() as g)
  );

create policy "care_documents_member_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'care-documents'
    and (storage.foldername(name))[1] in (select g::text from public.approved_group_ids() as g)
  );

commit;

-- ── Check the result ────────────────────────────────────────────────────────────
select id, public, file_size_limit from storage.buckets order by id;
select schemaname, tablename, policyname, cmd, roles
from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3;
