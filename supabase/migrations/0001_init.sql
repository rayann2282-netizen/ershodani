-- 0001_init.sql — first schema for Ershodani (ارشدني).
-- Run once in the Supabase SQL Editor. Never edit tables by hand: add a new numbered file instead.
--
-- Three tables, one student = one auth user (Supabase Auth owns emails and passwords).
-- Course names, hours and prerequisites live in web/src/data/studyPlan.js, not here.

-- ---------------------------------------------------------------------------
-- Shared: keep updated_at fresh on every update.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- student_courses: one row per course in the student's transcript (TranscriptEntry).
-- ---------------------------------------------------------------------------
create table public.student_courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- «نال 1200»: Arabic prefix, one space, four Western digits.
  course_code   text not null check (course_code ~ '^[ء-ي]{2,5} [0-9]{4}$'),
  -- Official grade codes (رموز التقديرات). null only when the student added the course by hand.
  grade         text check (grade in ('أ+', 'أ', 'ب+', 'ب', 'ج+', 'ج', 'د+', 'د', 'ند', 'هـ', 'ح', 'هد', 'ع', 'م', 'ل')),
  -- «لا، خلصتها» or «ضيف مادة خلصتها».
  marked_passed boolean not null default false,
  term          text check (char_length(term) <= 60),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint student_courses_one_row_per_course unique (user_id, course_code),
  constraint student_courses_grade_or_marked check (grade is not null or marked_passed)
);

create trigger student_courses_updated_at
  before update on public.student_courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- plans: one row per student — what the remaining-courses report says, plus choices.
-- ---------------------------------------------------------------------------
create table public.plans (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  current_level        smallint check (current_level between 1 and 8),
  level_courses        text[] not null default '{}',
  mandatory_university text[] not null default '{}',
  -- [{ "name": "...", "required": 2, "passed": 1, "options": ["دار 1001", ...] }]
  requirement_groups   jsonb not null default '[]' check (jsonb_typeof(requirement_groups) = 'array'),
  cumulative_gpa       numeric(3, 2) check (cumulative_gpa between 0 and 5),
  earned_hours         smallint check (earned_hours >= 0),
  -- University requirements the student picked. 2 hours each, so 9 is a hard ceiling for 19 hours.
  chosen_electives     text[] not null default '{}' check (cardinality(chosen_electives) <= 9),
  report_read_at       timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint plans_one_per_student unique (user_id)
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- gpa_inputs: one row per student. null = "use the number from my files".
-- ---------------------------------------------------------------------------
create table public.gpa_inputs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  current_gpa     numeric(3, 2) check (current_gpa between 0 and 5),
  completed_hours smallint check (completed_hours >= 0),
  planned_hours   smallint check (planned_hours > 0),
  target_gpa      numeric(3, 2) check (target_gpa between 0 and 5),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint gpa_inputs_one_per_student unique (user_id)
);

create trigger gpa_inputs_updated_at
  before update on public.gpa_inputs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: a student can only see and change their own rows.
-- ---------------------------------------------------------------------------
alter table public.student_courses enable row level security;
alter table public.plans           enable row level security;
alter table public.gpa_inputs      enable row level security;

create policy "own rows: select" on public.student_courses for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.student_courses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.student_courses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.student_courses for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own rows: select" on public.plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.plans for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own rows: select" on public.gpa_inputs for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.gpa_inputs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.gpa_inputs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.gpa_inputs for delete to authenticated using ((select auth.uid()) = user_id);
