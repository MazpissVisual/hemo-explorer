-- HemoExplorer: initial multi-school schema for Supabase/Postgres.
-- Apply in a development project first and add pgTAP RLS tests before production.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'teacher', 'student');
create type public.quiz_level as enum ('mudah', 'sedang', 'sulit');
create type public.submission_status as enum ('draft', 'submitted', 'reviewed');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  role public.app_role not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  student_code text unique,
  avatar_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_code_by_role check (
    (role = 'student' and student_code is not null) or
    (role <> 'student' and student_code is null)
  )
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 60),
  grade smallint not null default 6 check (grade between 1 and 12),
  academic_year text not null check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name, academic_year)
);

create table public.classroom_students (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (classroom_id, student_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  level public.quiz_level not null,
  score smallint not null check (score between 0 and 100),
  correct_answers smallint check (correct_answers >= 0),
  total_questions smallint check (total_questions > 0),
  answers jsonb not null default '{}'::jsonb,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  completed_at timestamptz not null default now()
);

create table public.pbl_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  case_key text not null check (case_key ~ '^[a-z0-9_-]+$'),
  answers jsonb not null default '{}'::jsonb,
  reflection text check (char_length(reflection) <= 3000),
  score smallint check (score between 0 and 100),
  feedback text check (char_length(feedback) <= 3000),
  status public.submission_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, classroom_id, case_key)
);

create table public.learning_events (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 60),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index profiles_school_id_idx on public.profiles(school_id);
create index profiles_role_idx on public.profiles(role);
create index classrooms_school_id_idx on public.classrooms(school_id);
create index classrooms_teacher_id_idx on public.classrooms(teacher_id);
create index classroom_students_student_id_idx on public.classroom_students(student_id);
create index quiz_attempts_student_id_idx on public.quiz_attempts(student_id);
create index quiz_attempts_classroom_id_idx on public.quiz_attempts(classroom_id);
create index quiz_attempts_completed_at_idx on public.quiz_attempts(completed_at desc);
create index pbl_submissions_student_id_idx on public.pbl_submissions(student_id);
create index pbl_submissions_classroom_id_idx on public.pbl_submissions(classroom_id);
create index learning_events_student_id_idx on public.learning_events(student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_set_updated_at before update on public.schools
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger classrooms_set_updated_at before update on public.classrooms
for each row execute function public.set_updated_at();
create trigger pbl_submissions_set_updated_at before update on public.pbl_submissions
for each row execute function public.set_updated_at();

-- Helper functions bypass table RLS only for authorization checks. They use an
-- empty search path and fully-qualified names to avoid object-shadowing attacks.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id from public.profiles p where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_student_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles actor
      join public.profiles student on student.id = target_student_id
      where actor.id = (select auth.uid())
        and actor.is_active
        and student.school_id = actor.school_id
        and (
          actor.role = 'admin'
          or (
            actor.role = 'teacher'
            and exists (
              select 1
              from public.classrooms c
              join public.classroom_students cs on cs.classroom_id = c.id
              where c.teacher_id = actor.id
                and cs.student_id = target_student_id
                and c.is_active and cs.is_active
            )
          )
        )
    );
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.current_school_id() from public, anon;
revoke all on function public.can_access_student(uuid) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_school_id() to authenticated;
grant execute on function public.can_access_student(uuid) to authenticated;

-- Students may edit their draft content, but review fields belong to teachers.
create or replace function public.protect_pbl_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.student_id then
    if new.student_id is distinct from old.student_id
      or new.classroom_id is distinct from old.classroom_id
      or new.case_key is distinct from old.case_key
      or new.score is distinct from old.score
      or new.feedback is distinct from old.feedback
      or new.reviewed_at is distinct from old.reviewed_at
      or new.status = 'reviewed' then
      raise exception 'Siswa tidak dapat mengubah identitas atau hasil review PBL';
    end if;
  elsif not (select public.can_access_student(old.student_id)) then
    raise exception 'Tidak memiliki akses untuk mereview submission ini';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_pbl_review_fields() from public, anon, authenticated;

create trigger pbl_submissions_protect_review
before update on public.pbl_submissions
for each row execute function public.protect_pbl_review_fields();

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.pbl_submissions enable row level security;
alter table public.learning_events enable row level security;

revoke all on table public.schools, public.profiles, public.classrooms,
  public.classroom_students, public.quiz_attempts, public.pbl_submissions,
  public.learning_events from anon, authenticated;

grant select on public.schools to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_key) on public.profiles to authenticated;
grant select, insert, update, delete on public.classrooms to authenticated;
grant select, insert, update, delete on public.classroom_students to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant select, insert, update on public.pbl_submissions to authenticated;
grant select, insert on public.learning_events to authenticated;
grant usage, select on sequence public.learning_events_id_seq to authenticated;

create policy schools_select_same_school on public.schools for select to authenticated
using (id = (select public.current_school_id()));

create policy profiles_select_allowed on public.profiles for select to authenticated
using ((select public.can_access_student(id)) or id = (select auth.uid()));

create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy classrooms_select_members on public.classrooms for select to authenticated
using (
  teacher_id = (select auth.uid())
  or school_id = (select public.current_school_id()) and (select public.current_app_role()) = 'admin'
  or exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = classrooms.id and cs.student_id = (select auth.uid()) and cs.is_active
  )
);

create policy classrooms_insert_teacher on public.classrooms for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (
    teacher_id = (select auth.uid()) and (select public.current_app_role()) = 'teacher'
    or (select public.current_app_role()) = 'admin'
  )
);

create policy classrooms_update_owner on public.classrooms for update to authenticated
using (teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
with check (school_id = (select public.current_school_id()));

create policy classrooms_delete_owner on public.classrooms for delete to authenticated
using (teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy classroom_students_select_members on public.classroom_students for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = (select auth.uid()))
  or (select public.current_app_role()) = 'admin'
);

create policy classroom_students_insert_teacher on public.classroom_students for insert to authenticated
with check (
  exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin'))
  and exists (select 1 from public.profiles p where p.id = student_id and p.role = 'student' and p.school_id = (select public.current_school_id()))
);

create policy classroom_students_update_teacher on public.classroom_students for update to authenticated
using (exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')))
with check (exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')));

create policy classroom_students_delete_teacher on public.classroom_students for delete to authenticated
using (exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')));

create policy quiz_attempts_select_allowed on public.quiz_attempts for select to authenticated
using ((select public.can_access_student(student_id)));

create policy quiz_attempts_insert_self on public.quiz_attempts for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = quiz_attempts.classroom_id
      and cs.student_id = (select auth.uid()) and cs.is_active
  )
);

create policy pbl_submissions_select_allowed on public.pbl_submissions for select to authenticated
using ((select public.can_access_student(student_id)));

create policy pbl_submissions_insert_self on public.pbl_submissions for insert to authenticated
with check (
  student_id = (select auth.uid())
  and score is null and feedback is null and reviewed_at is null
  and exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = pbl_submissions.classroom_id
      and cs.student_id = (select auth.uid()) and cs.is_active
  )
);

create policy pbl_submissions_update_student_or_teacher on public.pbl_submissions for update to authenticated
using ((select public.can_access_student(student_id)))
with check ((select public.can_access_student(student_id)));

create policy learning_events_select_allowed on public.learning_events for select to authenticated
using ((select public.can_access_student(student_id)));

create policy learning_events_insert_self on public.learning_events for insert to authenticated
with check (student_id = (select auth.uid()));

comment on table public.profiles is 'Application identity and role; auth.users remains the authentication source.';
comment on table public.quiz_attempts is 'Immutable quiz attempt history. Production scoring should be verified server-side.';
comment on table public.pbl_submissions is 'One PBL submission per student, classroom, and case.';
