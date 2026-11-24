-- 0002_grants.sql — let signed-in students use the three tables through the Data API.
-- Run once in the Supabase SQL Editor, after 0001_init.sql.
--
-- Why: this project does not expose new tables to the API automatically, so even a
-- signed-in student gets "permission denied". GRANT opens the door to the table;
-- Row Level Security (from 0001) still decides which ROWS each student sees: only their own.
-- The anon role (not signed in) gets nothing.

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.student_courses to authenticated;
grant select, insert, update, delete on public.plans           to authenticated;
grant select, insert, update, delete on public.gpa_inputs      to authenticated;
