-- 0003_remaining_levels.sql — keep every remaining level from the report, not just the next one.
-- Run once in the Supabase SQL Editor, after 0002_grants.sql.
--
-- Why: the plan fills the semester with the next level's open courses (for example level 5)
-- when the current level has only a few courses left. The level of a course comes from the
-- student's report (his track), which can differ from the study plan, so we store it as read.
--
-- Shape: [{ "level": 4, "courses": ["حسب 1250", "نال 1241"] }, { "level": 5, "courses": [...] }]

alter table public.plans
  add column remaining_levels jsonb not null default '[]'
  check (jsonb_typeof(remaining_levels) = 'array');
