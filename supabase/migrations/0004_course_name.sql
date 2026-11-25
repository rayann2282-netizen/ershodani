-- 0004_course_name.sql — keep each course's name as written in the transcript.
-- Run once in the Supabase SQL Editor, after 0003_remaining_levels.sql.
--
-- Why: some passed courses (old plans, early levels) are not in our study-plan data,
-- so the confirm screen could only show their code. The transcript has the name.
-- null = added by hand («لا، خلصتها») or read before this migration.

alter table public.student_courses
  add column course_name text check (char_length(course_name) <= 120);
