# ارشدني — DESIGN.md

Direction: **سهرة**. A calm night screen for a student lying in bed at 11 pm. One sharp colour (teal) shows where to start. Boldness is spent in one place per screen: the SEE FIRST item at 48px.

Canvas: https://claude.ai/artifact/HG83hdCj8UnQ4XFMj5kZS2 (style sheet artboard: `hf/style-sheet`)

---

## 1. Colour tokens

| Token | Hex | Allowed use only | Contrast |
|---|---|---|---|
| `bg` (ليل) | `#101315` | Background of every screen. Dominant. | — |
| `surface` (سطح) | `#1A1F22` | Cards, inputs, bottom sheet, loading button, pressed secondary button, disabled button | — |
| `line` (خط) | `#2A3135` | Dividers (1px), secondary button border, input border, chip border | — |
| `line-strong` | `#3A4246` | Dashed borders (upload slot, "+ باقي لك"), sheet handle, disabled radio border | — |
| `text` (حبر فاتح) | `#EEF1EF` | Primary text, icons | 16.0:1 on `bg` |
| `text-soft` | `#D5DBDA` | Body text inside cards and alerts | 13.2:1 on `bg` |
| `text-2` (رماد) | `#A3ACB0` | Secondary text, labels, hours, captions | 7.9:1 on `bg` |
| `locked` (مقفل) | `#8C979C` | Locked course rows only | 6.2:1 on `bg` |
| `radio-off` | `#5A6468` | Unselected radio border | 3.1:1 (non-text UI) |
| `disabled-text` | `#6B757A` | Disabled button and disabled option text | (disabled, exempt) |
| `accent` (فيروزي) | `#2EC4B6` | **Only:** primary button, «أولوية» badge, cause chain, selected radio, focus ring, "+" glyph, spinner | — |
| `accent-pressed` | `#26A89C` | Primary button pressed | — |
| `on-accent` (حبر الفيروزي) | `#062420` | Text and icons on `accent` | 7.6:1 on `accent` |
| `warning` (كهرماني) | `#F2B35B` | **Only:** errors and warnings (file unreadable, missing file, offline, over 19 hours, save failed, wrong login, impossible GPA) | 10.2:1 on `bg` |
| `scrim` | `#070809` | Behind the bottom sheet | — |
| `ghost-pressed` | `#232A2E` | Pressed state of rows inside a `surface` card | — |

Never: purple, gradients, glass, shadows, red.

## 2. Typography — 4 sizes only

Fonts (Google Fonts):
`https://fonts.googleapis.com/css2?family=Readex+Pro:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap`

| Role | Font | Size | Weight | Line height | Use |
|---|---|---|---|---|---|
| Display | Readex Pro | 48px | 700 | 1.2 | SEE FIRST only, once per screen («٥ مواد», «ارفع ملفينك», «٤٫٧١») |
| Title | Readex Pro | 22px | 700 / 500 | 1.2 | Screen titles, wordmark, secondary numbers («١٤ من ٢٠ ساعة»), stepper value |
| Body | IBM Plex Sans Arabic | 16px | 400 / 600 / 700 | 1.6 | Text, list items, buttons |
| Caption | IBM Plex Sans Arabic | 13px | 500 / 600 / 700 | 1.6 | Labels, section headers, notes, badges |

- No letter-spacing anywhere.
- Section headers: 13px / 700 / `text-2`.

## 3. Spacing — 8px grid

| Value | Use |
|---|---|
| 8 | Label ↔ field, between stacked buttons, icon ↔ text |
| 16 | Card padding, gaps inside cards, field ↔ field |
| 24 | Screen side padding, bottom padding, gaps between sections |
| 32 | Gaps between large groups (login, upload) |
| 48 | Row height, secondary button height, header bar height, min touch target for text links |
| 56 | Primary button height, input height, stepper button |

Screen padding: `8px 24px 24px` with a 48px header bar. On screens without a header bar (login, upload): `56px 24px 24px`.

## 4. Radius

| Value | Use |
|---|---|
| 2 | Progress bar |
| 8 | Badge, skeleton blocks |
| 12 | Input, icon button (back), dashed "+" row |
| 16 | Buttons, cards, alerts, upload slots |
| 24 | Bottom sheet top corners |
| 999 | Chips in the cause chain |

## 5. Shadows

None. Depth comes from `surface` on `bg`. Focus: `outline: 2px solid #2EC4B6; outline-offset: 2px`.

## 6. Components and their states

### Primary button (one per screen)
- 56h, radius 16, full width, bg `accent`, text `on-accent` 16/700, centred. Icon (20px) sits before the label.
- **Pressed:** `transform: scale(.98)`, bg `accent-pressed`, 120ms ease.
- **Loading:** bg `surface`, border 1.5px `accent`, text `text`, 20px spinner (stroke `accent`, 2.5, rotates 0.8s linear), label says what is happening («نجهّز الصورة…»).
- **Done:** bg `accent`, check icon (stroke `on-accent`, 3) pops in (`scale .6→1`, opacity 0→1, 250ms ease-out), label says the result («انحفظت في صورك»).
- **Disabled:** bg `surface`, text `disabled-text`.
- The label says what will happen: «احفظ خطتي صورة», «اختر السجل الأكاديمي من جديد», «أجّل الإحصاء · تصير ٢٠ ساعة».

### Secondary button
- 48h, radius 16, transparent, border 1.5px `line`, text `text` 16/600.
- **Pressed:** bg `surface`, scale .98.

### Text button / link
- min-height 48, 13px, `text-2` (or `text` 600 when it is an action), padding `0 8px`, pulled `-8px` to align with the edge.

### Input
- 56h, radius 12, bg `surface`, border 1.5px `line`, text 16px `text`, padding `0 16px`. Label above: 13/600 `text-2`, gap 8.
- **Focus:** border `accent`.
- **Error:** border `warning`, `aria-invalid="true"`, message under the fields (13px `warning`, alert icon 16px at start).
- Email and password: `dir="ltr"` + `text-align: right`.

### Card
- bg `surface`, radius 16, padding 16, no border.

### Late-course card (متأخرة)
- Card + row: course name 16/700, «أولوية» badge, hours at the end (`text-2`).
- Reason line 13px `text-soft`: «لم تتجاوزها · سجّلها هالترم عشان ما تتأخر» or «حذفتها الترم اللي فات (ع) · …».
- **Cause chain (signature):** dot 8×8 `accent` → line 16×2 `accent` → chip → line → chip. Chip: 13px, line-height 24, padding `0 8px`, border 1px `line`, radius 999. The chain reads right to left: cause → what it locks.

### List item
- 48h, border-bottom 1px `line`, 16px `text`; hours at the end (`margin-inline-start: auto`) in `text-2`.
- Optional second line: 13px `text-2` (course code).

### Locked list item
- Same as list item, text `locked`, lock icon 16px (stroke `locked`, 2) at start, reason at end in 13px: «بسبب كفاءات الإدارة». The whole row is a link to the locked sheet.

### Badge
- 13/700, line-height 24, padding `0 8px`, radius 8, bg `accent`, text `on-accent`. One word: «أولوية».

### Selection (radio)
- Circle 24. **Selected:** bg `accent` + check 14px stroke `on-accent` 3.5; label 600. **Unselected:** border 2px `radio-off`. **Disabled:** border 2px `line-strong`, text `disabled-text`, `aria-disabled`.
- Row: min-height 48, gap 16, course code at the end in 13px `text-2`.

### Stepper (GPA target)
- Two 56×56 buttons, radius 16, border 1.5px `line`, «−» on the right (start), «+» on the left (end), value centred 22/700. Step 0.25, range 2.00–5.00.

### Bottom sheet
- bg `surface`, radius `24 24 0 0`, padding `8 24 24`, handle 40×4 `line-strong` radius 2. Screen behind: `scrim` with the previous content at 30% opacity.

### Progress bar
- 4h, radius 2, track `line`, fill `text`. Fills from the right.

### Alert
- border 1.5px `warning`, radius 16, padding 16, gap 8. Title 16/700 (icon 16–18px `warning` at start). Body 13px `text-soft`. `role="alert"`.

### Upload slot
- padding 16, radius 16, border 1.5px dashed `line-strong`. Number tile 48×48 radius 12 bg `surface`, numeral 22/700. **Done:** bg `surface`, no border, check icon. **Error:** border solid `warning` (unreadable) or dashed `warning` (missing).

### Skeleton
- bg `surface`, radius 8, shimmer opacity .5→1→.5, 1.4s ease-in-out infinite.

### Logo
- Source: the gold-and-teal mark (graduation cap + road + A+) on navy. Canvas asset: `/_blob/2f8fa3378b6be434733a42133e89c8f2`.
- Shown as a **tile**: navy `#0A1833` square with `overflow: hidden`. The image is scaled to 160% and centred with a negative margin, so the mark fills the tile:
  - **40 tile** (login): 40×40, radius 12, image 64×64, margin −12px
  - **32 tile** (header): 32×32, radius 8, image 52×52, margin −10px
- **Lockup:** tile + «ارشدني» (Readex Pro 22/700), gap 8.
- Placement, on every screen:
  - Login: 40 lockup at the top (start).
  - Plan and its states, upload and its states: 32 lockup at the start of a 48px header bar.
  - Screens with a back arrow (confirm, electives, GPA and their states): 32 tile **alone** at the end (left) of the header bar, opposite the arrow.
  - Locked sheet: 32 lockup in the dimmed screen behind the sheet.
- The logo is not mirrored in RTL. Its gold is part of the logo only and is never used as a UI colour.
- `alt=""` when the word «ارشدني» sits next to the tile; `alt="ارشدني"` when the tile is alone.

### Tab bar
- Not used. The flow is linear; navigation is the back arrow plus links.

## 7. Motion — one idea

«احفظ خطتي صورة»:
1. Press → loading state (1.1s).
2. Done state: check pops in (250ms); the plan above shrinks to `scale(.97)` with a 2px `accent` ring and returns (600ms ease-out), as if photographed.
3. After 2.4s the button returns to its default state.

All presses: 120ms `scale(.98)`.

Plan rows (added 2026-11-25): each course rises in (opacity 0→1, 8px up, 320ms ease-out), 60ms after the one before it, in page order. Off with `prefers-reduced-motion` and while the plan image is taken. The welcome steps use the same rise.

## 8. Arabic and RTL rules

- `<html lang="ar" dir="rtl">`; use logical properties (`margin-inline-start`, `padding-inline`).
- The back arrow points **right** (→) and sits at the start (right).
- Progress fills from the right.
- Icons sit at the start (right) of their labels.
- No letter-spacing on Arabic.
- Arabic-Indic digits in the UI, with `٫` as the decimal separator: «٣٫٨٢», «١٤ من ٢٠ ساعة», «عال ١٣٢٢», «٤٠٪».
- Use Arabic punctuation: «،» «؟» and the quote marks « ».
- Isolate LTR content: email and password inputs use `dir="ltr"`; file names use `<span dir="ltr">`; English names use `<bdi dir="ltr">`.
- These are not mirrored: the spinner (clockwise), the upload arrow, the down chevrons and the check icon.
- Tone: light Saudi colloquial («خلصتها»، «سجّلها هالترم»، «ما يمديك»).
