# Ershodani (ارشدني)

## Overview
Imam University Information Systems students can't easily see which courses they can take next semester or what GPA they need; Ershodani shows both on their phone. See PRD.md for scope.

## MVP scope
Pilot: **one hardcoded study plan, Information Systems major (two-semester plan)**. Demo story: the plan for next semester.
Must stories (updated by the design decisions in HANDOFF.md §10):
1. Upload two PDFs from the portal (كشف المقررات المتبقية + السجل الأكاديمي); the site reads them and the student confirms the passed courses. Manual marking stays as a fallback.
2. See the courses to take next semester **according to the plan**: late courses first, then the current level, then locked courses with the course that blocks them. Max 19 hours. **This is the demo, so it must be flawless.**
3. Required semester GPA for a target GPA. GPA scale is out of 5 (confirmed).
Should/Could, now in scope: choose university requirements to fill the remaining hours; save the plan as an image.

Out of scope: section details (CRNs, times, instructors, rooms), schedule conflicts, university portal login/integration, OCR of scanned PDFs, multiple majors or colleges, the very old plans F–H, chat with advisors, any AI feature, real-time features.
Current phase: **front end on mock data only**. PDF parsing, Supabase and image export come with the backend.
If I ask for anything out of scope, say so before building it.

## Design
- Read DESIGN.md before any UI work (written on day 2). Until it exists, build plain unstyled structure.
- Arabic only, right-to-left: `<html lang="ar" dir="rtl">`. Use CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`), never left/right. No `letter-spacing` on Arabic text.
- Mobile-first: the user is on a phone at night. Design for ~375px width first.
- Design tokens (colours, fonts, spacing) live only in `web/src/tokens.css`. No hard-coded values elsewhere.
- Tone of voice: light Saudi colloquial, like a helpful friend. Short and clear. Example: "حدد المواد اللي خلصتها" (not "يرجى تحديد المقررات المجتازة").

## Stack
| Tech | Why | Version (verified 2026-11-23) |
|---|---|---|
| Node.js LTS | Runs Vite and npm | 26.x LTS (26.13.1) |
| npm | Starter already uses it | bundled with Node |
| JavaScript (no TypeScript) | Simplest for a beginner | — |
| React | Camp starter, huge community | 19.3.1 |
| Vite + @vitejs/plugin-react | Camp starter, fast dev server | 8.3.8 / 6.3.0 |
| React Router (declarative mode, import from `react-router`) | Real URLs per screen; phone back button works | 8.5.1 |
| Plain CSS + `tokens.css` | No extra tool to learn | — |
| State: `useState` + one Context for the signed-in user | 3 screens don't need a state library | — |
| Supabase (free plan): Postgres + Auth | Saves each student's progress across devices | supabase-js 2.119.0 |
| Vitest | Tests the two core calculations only | 5.1.0 |
| Vercel (Hobby) | Free hosting for `web/` | — |

Notes:
- Auth = email + password, **"Confirm email" turned OFF** in Supabase. The free default email sender only delivers to project team members, so no auth emails are sent. No "forgot password" in the MVP.
- Free Supabase projects pause after ~1 week of no use. Resume from the dashboard.
- The study plan is a static JS file, not a database table: it is the same for everyone and read-only.

## Commands
All run inside `web/`:
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint` *(to confirm: depends on the starter's package.json)*
- Test: `npm test` *(to confirm: add `"test": "vitest"` to package.json when Vitest is installed)*

## Architecture
Feature-based single-page app; the browser talks directly to Supabase, and Row Level Security protects the data. Core logic (eligible courses, required GPA) is pure functions in each feature, separate from UI, and covered by Vitest.

## Project structure
```
ershodani/
├── CLAUDE.md                  # this file
├── PRD.md                     # product requirements
├── DESIGN.md                  # visual design (day 2)
├── design/                    # starter: design references
├── plain/                     # starter: plain reference version
├── example/                   # starter: example code
├── supabase/
│   └── migrations/            # numbered SQL files: tables, constraints, RLS
└── web/                       # Vite + React app (deployed to Vercel)
    ├── index.html             # lang="ar" dir="rtl"
    ├── .env.example           # env variable names only
    ├── package.json
    └── src/
        ├── main.jsx           # app entry
        ├── App.jsx            # routes
        ├── tokens.css         # design tokens only
        ├── features/
        │   ├── auth/          # sign up, sign in, sign out, user context
        │   ├── courses/       # passed-courses checklist, eligible list, eligibility.js + test
        │   └── gpa/           # target GPA form, gpa.js + test
        ├── lib/               # supabaseClient.js, env.js (env check), shared helpers
        └── data/              # IS study plan (courses, hours, prerequisites) + mock student data
```

## Build order
1. Screens on mock data, one at a time (checklist → eligible list → GPA form). Logic + tests first for each.
2. Backend and data, one feature at a time (auth → passed courses → GPA inputs).
3. Connect each screen to real data, one at a time.

## Deployment
Vercel (Hobby plan), root directory `web/`. No self-managed servers.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.

## Working rules for AI agents
- Ask before assuming. For anything that touches more than a couple of files, plan first and wait for my OK.
- One task at a time. Explain non-obvious decisions in plain words: I am a complete beginner (first time coding). Name the concept (e.g. "this is called a prop").
- Talk to me in Arabic; keep code, file names and commands in English.
- Match existing patterns. Clean up what you touch. Look at the result (screenshot, mobile width) before saying a UI change is done.
- Never install a package version published in the last 7 days.
- No new dependencies without asking me first.

## Secrets
- All secrets in environment variables. Never commit `.env` or `.env.local`.
- Keep `web/.env.example` with names only.
- `web/src/lib/env.js` checks required env variables at startup and shows a clear error if one is missing.
- Only the Supabase **anon/publishable** key goes in the frontend. Never the `service_role`/secret key, anywhere in `web/`.
- Keep `.gitignore` thorough (`node_modules`, `dist`, `.env*` except `.env.example`, `.vercel`). Check it before every push.

## Data rules
- Schema lives only in `supabase/migrations/`, changed only by new numbered migration files in git (run them in the Supabase SQL Editor in order). Never edit tables by hand in the dashboard.
- Row Level Security ON for every table. Policies: a user can only select/insert/update/delete rows where `user_id = auth.uid()`.
- Planned tables: `passed_courses (user_id, course_code)`, `gpa_inputs (user_id, current_gpa, completed_hours, planned_hours, target_gpa)`.
- Select only the columns you need. Paginate any list that can grow.

## Auth rules
- Use Supabase Auth only, never hand-rolled auth.
- Permissions are enforced by RLS in the database, never only in the UI.

## Input rules
- Validate in the form for UX, and enforce with database constraints (e.g. GPA between 0 and 5, hours ≥ 0, course_code must exist in the plan).
- Never render user input as raw HTML (no `dangerouslySetInnerHTML`).
- File uploads: PDF only, the two portal files. Parse in the browser and store only the course list, never the PDF (it holds the name, student ID and birth year). [?] to confirm with the backend.
