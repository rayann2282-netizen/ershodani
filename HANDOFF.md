# ارشدني — HANDOFF.md

Canvas: https://claude.ai/artifact/HG83hdCj8UnQ4XFMj5kZS2
Prototype: https://claude.ai/artifact/HG83hdCj8UnQ4XFMj5kZS2#play-hf-01-login
Design tokens and components: `DESIGN.md` · Sample data: `mock.json`

Anything marked **[?]** is an assumption or an open question. Confirm it before building.

---

## 1. Persona and core task

**Persona:** An Information Systems student at Imam University in level 4. He is lying in his room at 11 pm, two days before registration opens. His phone is in one hand, and his remaining-courses report and academic transcript (PDFs from the university portal) are on the same phone. He has about 10 minutes.

**Core task:** Know which courses he **should** register next semester according to his plan, and which courses are locked and why, without visiting academic advising.

**Feel:** واضح، مطمّن، سريع · **Not:** حكومي، مزحوم

**Platform:** Mobile-first website, 390px, Arabic only, RTL. Email + password sign-in (Supabase). Each student sees only their own data. No AI and no real-time features.

## 2. Screens

| # | Screen | Artboard | Purpose |
|---|---|---|---|
| 1 | الدخول | `hf/01-login` | Sign in |
| 2 | ارفع ملفاتك | `hf/02-upload` | Pick both PDFs at once |
| 3 | تأكد من موادك | `hf/03-confirm` | Review passed and failed courses |
| 4 | خطتك للترم الجاي | `hf/04-plan` | **Main screen.** SEE FIRST: «٥ مواد · ١٤ من ٢٠ ساعة». MAIN ACTION: «احفظ خطتي صورة» |
| 5 | مادة مقفلة | `hf/05-locked` | Bottom sheet that explains why a course is locked |
| 6 | اختر متطلباتك | `hf/06-electives` | Fill the remaining hours from university-requirement groups |
| 7 | المعدل اللي تحتاجه | `hf/07-gpa` | Required semester GPA for a target |

States: `st/01-error`, `st/02-loading`, `st/02-unreadable`, `st/02-missing`, `st/02-offline`, `st/03-empty`, `st/04-loading`, `st/04-empty`, `st/04-full`, `st/04-save-error`, `st/04-saved`, `st/04-withdrawn`, `st/06-full`, `st/06-empty`.

## 3. Happy path (5 taps to the plan, 6th tap saves)

1. **الدخول:** type email + password → «ادخل» (tap 1)
2. **ارفع ملفاتك:** «اختر الملفين» (tap 2) → pick the report (tap 3) and the transcript (tap 4) in the phone's file picker
3. *(loading: «نقرأ ملفينك»)*
4. **تأكد من موادك:** «صح، اعرض خطتي» (tap 5)
5. *(loading: «نرتب خطتك…»)*
6. **خطتك للترم الجاي:** «احفظ خطتي صورة» (tap 6) → loading → «انحفظت في صورك»

## 4. Unhappy paths

| Where | Trigger | Artboard | What the user can do |
|---|---|---|---|
| Login | Wrong email or password | `st/01-error` | Retry, or «نسيت كلمة المرور؟» |
| Upload | One file is an image or a scanned PDF (situation A) | `st/02-unreadable` | «اختر السجل الأكاديمي من جديد» or «كمّل بدونه وحدد درجاتك بيدك» |
| Upload | Only one file picked | `st/02-missing` | «اختر السجل الأكاديمي» or continue without it |
| Upload | Connection lost during upload | `st/02-offline` | «جرّب مرة ثانية» resumes; the files stay on the phone |
| Confirm | No passed course found (first semester) | `st/03-empty` | Nothing to plan; come back before semester 2. Also «ضيف مادة خلصتها» |
| Confirm | A course read as failed was actually passed | `hf/03-confirm` | «لا، خلصتها» marks it as passed |
| Plan | Required course locked by a failed or withdrawn course (situation B) | `hf/05-locked`, `st/04-withdrawn` | Read the reason; register the blocking course this semester |
| Plan | Total hours over 19 | `st/04-full` | «أجّلها · تصير ١٩ ساعة» (suggested) or «أختار بنفسي وش أشيل» |
| Plan | Nothing left in the report | `st/04-empty` | «افتح بوابة الجامعة» to apply for graduation |
| Plan | Saving the image is blocked by the browser | `st/04-save-error` | «جرّب مرة ثانية», or «انسخ خطتي كنص» |
| Electives | Selection reaches 19 hours | `st/06-full` | Remaining options disabled; deselect to choose another |
| Electives | All university groups are complete | `st/06-empty` | «ارجع لخطتي» |
| GPA | Target cannot be reached even with 5.00 | `hf/07-gpa` | Message shows the highest reachable GPA |

## 5. Data (nouns)

- **Student:** `id`, `email`, `fullName` (read from the report), `createdAt`
- **UploadedFile:** `kind` (`remaining_report` | `transcript`), `fileName`, `status` (`read` | `unreadable` | `missing`) **[?] stored or discarded after parsing, see §9**
- **Course:** `prefix` (عال، نال، حسب…), `number` (int), `nameAr`, `hours`, `level` (1–8 | null), `type` (`mandatory` | `university` | `free` | `is_elective`), `prereqs[]` (course keys)
- **StudyPlan:** IS two-semester plan, hardcoded: `courses[]` with `prereqs`
- **RequirementGroup** (from the report): `name`, `rule` {`type`: `courses` | `hours`, `count`}, `courses[]` {course, `status`: `passed` | `not_passed`}
- **TranscriptEntry:** `course`, `grade` (أ+، أ، ب+، ب، ج+، ج، د+، د، ند، هـ، ح، هد، ع، م، ل — see rules 7–9), `hours`, `term` (e.g. «الفصل الثاني ١٤٤٧»)
- **TranscriptSummary:** `cumulativeGpa` (out of 5), `earnedHours`, `startedOnThreeSemesterSystem` (bool)
- **Plan:** `late[]` {course, `reason`: `failed` | `withdrawn` | `not_registered`}, `levelCourses[]`, `locked[]` {course, `blockedBy[]`}, `chosenElectives[]`, `totalHours`, `maxHours` = 19, `deferred[]`
- **GpaCalc:** `currentGpa`, `earnedHours`, `plannedHours`, `targetGpa`, `requiredGpa`

## 6. Actions (verbs)

Sign in · sign up · reset password · pick two PDFs at once · detect which file is which · parse the remaining-courses report · parse the transcript · mark a course as passed («لا، خلصتها») · add a forgotten course · build the plan · open a locked course's reason · choose university requirements · defer a course · save the plan as an image · copy the plan as text · calculate the required GPA · edit courses («عدّل موادي»).

## 7. Rules (from every error, empty and full state)

**Files and parsing**
1. Only PDF files are accepted. Images (png, jpg, heic) are rejected with the `st/02-unreadable` message.
2. Both files are needed. If one is missing, show `st/02-missing`. The student may continue without the transcript (manual grades) **[?] manual entry screen not designed**.
3. Detect the file type from its header text: «كشف بالمقررات المتبقية» = report; «سجل الطالب الأكاديمي» = transcript.
4. Extracted Arabic text comes out reversed and broken, so **match by course number**. Convert Arabic-Indic digits to Western digits (`١٢٤٢` → `1242`), then match prefix + number. The prefix may be glued to the number («نال١٢٢٠»).
5. Transcript text is extracted column by column (all codes, then all names, then all grades). Pair them by index and check that the counts match; if they don't, treat the file as unreadable.
6. A PDF with no extractable text (a scanned image) counts as unreadable. No OCR.

**Grades**
Source: the university's grade-code sheet («رموز التقديرات»).

7. **Passed:** `أ+` (95–100) · `أ` (90–<95) · `ب+` (85–<90) · `ب` (80–<85) · `ج+` (75–<80) · `ج` (70–<75) · `د+` (65–<70) · `د` (60–<65) · `ند` (ناجح دون درجة: passed, not counted in the GPA).
8. **Not passed → the course is late, with reason «لم تتجاوزها»:** `هـ` (راسب, <60) · `ح` (محروم, counts as a fail in the GPA) · `هد` (راسب دون درجة, not counted in the GPA).
   **Not passed → late, with reason «حذفتها … (ع)»:** `ع` (منسحب بعذر).
9. **Not finished yet:** `م` (مستمر: the student is taking it now) · `ل` (غير مكتمل). **Decided:** treat them as passed when building next semester's plan, but every course that depends on them gets a note: «تنفتح لك إذا تجاوزت «[المادة]» هالترم» (artboard `st/04-in-progress`). The reason: students download the transcript before the current semester ends, so most courses would otherwise show as locked. **[?]** `ل` follows the same rule unless the university says otherwise.

**Plan**
10. The student's track comes from the report (its level groups ف٤…ف٨). No A–E track tables are needed.
11. Order (changed 2026-11-24): late courses first (failed or withdrawn only, badge «أولوية»), then the current level from the report, then **open courses from the next levels** in plan order while they fit under 19 hours, then the suggestion for remaining hours, then locked courses. A next-level course whose prerequisite is in this semester's plan is shown locked: «بعد [المادة]». Mandatory university courses (القرآن، المهارات اللغوية) are **not late**: they can be taken any term, so they are the first group in «اختر متطلباتك».
12. A course is **locked** if any prerequisite is not passed. Show which course blocks it: «بسبب كفاءات الإدارة».
13. A failed or withdrawn course that blocks others shows the cause chain and «قفلت عليك مادتين».
14. The maximum is **19 hours** per semester. If the total is over 19, suggest deferring a course that **blocks no mandatory course**: first a chosen university requirement, then a level course, then a late course.
15. First semester: the university registers level 1 automatically, so the site shows `st/03-empty` and builds no plan.
16. If nothing is left in the report, show `st/04-empty`.

**Electives (university requirements)**
17. Show only groups whose rule is not met yet («باقي ١ من ٢»). List only courses with status `not_passed`.
18. When the total reaches 19 hours, disable the other options.
19. Each university requirement is 2 hours.

**GPA (out of 5)**
20. `required = (target × (earned + planned) − current × earned) ÷ planned`, rounded **up** to 2 decimals.
21. If `required > 5`: show «ما يمديك» and `maxReach = (current × earned + 5 × planned) ÷ (earned + planned)`, rounded **down**.
22. If `required ≤ 0`: «هدفك محقق أصلاً».
23. `current` and `earned` come from the transcript; `planned` = plan total **[?] it must update when electives are added**.

**Save**
24. The image file is named `ershodani-plan-<hijri year>-<semester>.png` **[?]**. If the browser blocks saving, show `st/04-save-error`.

## 8. State texts (exact copy)

| Artboard | Title | Body | Buttons |
|---|---|---|---|
| `st/01-error` | — | الإيميل أو كلمة المرور ما تطابق. تأكد إن لوحة المفاتيح إنجليزي، أو غيّر كلمة المرور من تحت. | ادخل · نسيت كلمة المرور؟ |
| `st/02-loading` | نقرأ ملفينك | ثواني بس. خلّ الصفحة مفتوحة. · قريناه · ٢٧ مادة باقية عليك · نقرأ درجاتك… | (loading) نقرأ… خطوة ٢ من ٢ قريب |
| `st/02-unreadable` | السجل صورة | الملف «Screenshot_2026-11-20.png» صورة شاشة، وإحنا نقرأ ملفات PDF بس. نزّل السجل الأكاديمي من البوابة كـ PDF واختره من جديد. | اختر السجل الأكاديمي من جديد · كمّل بدونه وحدد درجاتك بيدك |
| `st/02-missing` | ناقصك السجل | وصلنا كشف المقررات المتبقية. نحتاج السجل الأكاديمي بعد، عشان نضبطك بأحلى جدول | اختر السجل الأكاديمي · كمّل بدونه وحدد درجاتك بيدك |
| `st/02-offline` | انقطع النت | ملفاتك ما ضاعت، محفوظة في جوالك. أول ما يرجع النت اضغط «جرّب مرة ثانية» ونكمل من مكان ما وقفنا. | جرّب مرة ثانية |
| `st/03-empty` | أول ترم لك؟ | ما لقينا ولا مادة خالصة في سجلك. في أول ترم، الجامعة تسجّل لك مواد المستوى الأول تلقائياً، فما تحتاج تسوي شي الحين. ارجع لنا قبل تسجيل الترم الثاني. | تمام، بتجينا قبل الترم الثاني · ضيف مادة خلصتها |
| `st/04-loading` | — | نرتب خطتك… · نطابق ٢٧ مادة باقية مع متطلباتها السابقة | (disabled) احفظ خطتي صورة |
| `st/04-empty` | خلصت خطتك كاملة | ما باقي عليك ولا مادة في كشف المقررات المتبقية. الخطوة الجاية: قدّم طلب التخرج من بوابة الجامعة. | افتح بوابة الجامعة · احسب معدلك النهائي |
| `st/04-full` | زادت ٣ ساعات عن الحد | الحد ٢٠ ساعة. نقترح تأجّل «مقدمة في الاحتمالات والإحصاء» للترم اللي بعده، لأنها ما تقفل عليك أي مادة إجبارية. | أجّل الإحصاء · تصير ٢٠ ساعة · أختار بنفسي وش أشيل |
| `st/04-save-error` | ما انحفظت الصورة | المتصفح ما سمح لنا نوصل لصورك. اضغط «جرّب مرة ثانية» واختر «سماح» لما يسألك، أو خذ لقطة شاشة لهالصفحة. | جرّب مرة ثانية · انسخ خطتي كنص |
| `st/04-saved` | تلقاها في الصور | باسم «ershodani-plan-1448-2.png». افتحها يوم التسجيل وسجّل منها. | (done) انحفظت في صورك |
| `st/04-withdrawn` | — | حذفتها الترم اللي فات (ع) · سجّلها هالترم عشان ما تتأخر · لأنك حذفت كفاءات الإدارة | احفظ خطتي صورة |
| `st/06-full` | — | وصلت حد الـ ٢٠ ساعة. تبي مادة ثانية؟ شيل اختيار من فوق أول. | ضيف ٣ مواد لخطتي · تصير ٢٠ ساعة |
| `st/06-empty` | كمّلت متطلباتك الجامعية | ما باقي لك قسم تختار منه. خطتك تبقى ١٤ ساعة، وهذا تحت الحد وما يأخرك عن التخرج. | ارجع لخطتي |
| `hf/05-locked` | أنظمة التشغيل | لم تتجاوز كفاءات الإدارة، فتقفلت عليك هذي المادة. سجّلها هالترم: إذا نجحت فيها، تنفتح لك أنظمة التشغيل وعلاقات الأعمال الترم اللي بعده، وما تتأخر. | تمام، فهمت |
| `hf/07-gpa` (impossible) | ما يمديك | حتى لو جبت ٥ كاملة هالترم، أعلى معدل توصله ٤٫٠٥. نزّل هدفك أو وزّعه على ترمين. | ارجع لخطتي |

## 9. Open questions for the backend

1. **[?] Privacy:** should the PDFs be parsed in the browser and never uploaded, or stored in Supabase Storage? The transcript holds the name, student ID and birth year. Recommendation: parse client-side and store only the course list.
2. ~~What do grades `ح`, `م` and `ل` mean for the plan?~~ Settled: `ح` = not passed (rule 8); `م` and `ل` = passed, with a note (rule 9).
3. ~~Who checks the prerequisite data?~~ Decided (2026-11-24): a Vitest test checks every course in `studyPlan.js` against the official plan (hours, level, prerequisites), and the student checks the level 4–5 courses (the demo) with one person from the department.
3a. Found (2026-11-24) by checking against «المقررات المكافئة … مع المتطلبات» (للنشر) and the final plan: أنظمة التشغيل (عال 1322) needs **عال 1242 + نال 1130**, not نال 1200. Fixed in `studyPlan.js`. So in the demo, failing كفاءات الإدارة locks علاقات الأعمال only; the design's «قفلت عليك مادتين» example (canvas `hf/05-locked`) is now out of date. Old three-semester codes are mapped to their new equivalents (`EQUIVALENTS` in `studyPlan.js`) before checking prerequisites.
3b. Decided (2026-11-24): when a student uploads new files, the new report and transcript **replace** the old ones completely; «لا، خلصتها» marks and chosen requirements stay only if they still make sense for the new files.
4. **[?]** Does every remaining-courses report have the same layout (level groups «نظم المعلومات ف٤…» + requirement groups + «تجاوز … من المجموعة»)? Test it with 3–5 real students.
5. **[?]** The sign-up screen and the manual-grade entry screen are not designed. The prototype links them to the next screen.
6. **[?]** Chosen electives must update the plan total and the GPA `planned` hours. The prototype doesn't do this.
7. **[?]** Is the 20-hour limit flat for everyone, or does it depend on GPA? (Decided: flat 19, changed from 20.)
8. **[?]** Content of the help links «وين ألقاهم في البوابة؟» and «كيف أنزّله PDF من البوابة؟»: which portal menu path?
9. **[?]** Image export method (for example, html-to-image) and the image file-name format.
10. Out of scope: the very old plans F–H; schedule conflicts, sections and times; portal login.

## 10. Decision log

1. The student uploads files; the site reads them (changes the PRD scope)
2. Persona confirmed
3. Manual selection kept as a fallback
4. Core task = what to register **according to the plan**
5. Flow: login → upload → confirm → plan; login comes first
6. Unhappy situations to design for: file unreadable; course locked by a prerequisite
7. SEE FIRST = course count + hours; list order: late, level, locked
8. MAIN ACTION = «احفظ خطتي صورة» (Could story)
9. FEEL واضح، مطمّن، سريع / NOT حكومي، مزحوم
10. GPA is out of 5
11. Visual reference: simple, clear, dark
12. Study plan: IS two-semester plan (final)
13. Support the new plan + tracks A–E; F–H out of scope (simplified by decision 20)
14. The site explains what a failed course locked; no advising visit
15. The student stays on his track; the late course must be retaken this semester
16. Maximum 19 hours (changed from 20)
25. GPA screen: the student can edit every number by hand (current GPA, earned hours, planned hours, target); the file values are the defaults
17. Withdrawal = ع, fail = هـ
18. Suggest filling the remaining hours with university requirements
19. Show university groups not yet complete; the student chooses
20. Upload both the remaining-courses report and the transcript
21. First semester is registered automatically by the university
22. Direction: سهرة
