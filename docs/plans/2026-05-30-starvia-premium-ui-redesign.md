# STARVIA Premium UI Redesign Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign STARVIA landing and report entry experience so it feels more premium, easier to read, and more likely to convert visitors into trial users, newsletter subscribers, and 199 THB/month customers.

**Architecture:** Preserve the current static/vanilla JS app and single Railway deployment. Improve UI in small slices: design tokens, landing hierarchy, input flow, newsletter/value ladder, and result-page premium cards. Avoid changing astrology calculation or premium unlock behavior in the same slice.

**Tech Stack:** HTML, CSS, vanilla JS, Vite, Vitest, Node server on Railway.

---

## Current UI Audit

**Overall score:** 6.8 / 10

**Category scores:**
- Brand mood / mystical identity: 8.0 / 10
- Visual polish: 6.5 / 10
- Readability: 6.0 / 10
- Mobile conversion clarity: 6.0 / 10
- Premium perceived value: 5.8 / 10
- Trust / privacy / legitimacy: 6.5 / 10
- Commercial CTA clarity: 5.5 / 10

**Strengths:**
- Dark cosmic mood matches the product.
- Gold accent and star field create a recognizable brand.
- Main action is simple: enter name and birth date.
- Privacy message is present.
- Newsletter capture already exists.

**Weaknesses:**
- Too much text is small, low-contrast, and centered, which weakens readability.
- The hero does not clearly show what the user receives after submitting.
- The price/value proposition is missing above the fold.
- The testimonial feels generic and unsupported.
- Form inputs feel functional but not premium.
- The page has no strong value ladder: free insight, premium depth, example outputs, trust proof.
- Newsletter section appears detached from the main product journey.

## Design Read

**Page kind:** Consumer landing page + report entry flow.

**Audience:** Thai users interested in astrology, self-discovery, relationships, career/money guidance, and auspicious timing.

**Vibe:** Premium mystical, calm, trustworthy, Thai-first, not noisy horoscope spam.

**Design dials:**
- DESIGN_VARIANCE: 7
- MOTION_INTENSITY: 4
- VISUAL_DENSITY: 4

**Aesthetic family:** Linear/Apple polish + dark cosmic Thai astrology. Use restrained gold, deeper navy/purple, readable cards, clear hierarchy.

## Target Business Outcome

Redesign should make STARVIA feel worth 199 THB/month by making the visitor understand:
1. What they get free today.
2. What premium unlocks.
3. Why the report is personal.
4. Why it is safe to enter birth data.
5. What action to take next.

## New Page Structure

1. **Premium hero**
   - Short headline: “รู้จักตัวเองจากวันเกิด ไม่ใช่แค่ดูดวง”
   - Subheadline: explain outcome in 1-2 lines.
   - Primary CTA: “เริ่มดูดวงฟรี”
   - Secondary CTA: “ดูตัวอย่างรายงานพรีเมียม”
   - Small price badge: “Premium 199 บาท/เดือน”

2. **What you get section**
   - 4 cards: ตัวตน, ความรัก, งาน/เงิน, ฤกษ์ดี
   - Use Thai labels only.
   - Make each card outcome-based, not feature-only.

3. **Report preview / value ladder**
   - Show sample output cards: กำลังวันประจำตัว, แผนที่ชีวิตรายเดือน, สูตรลาภลอย, กระจกกรรม.
   - Mark Free vs Premium clearly.

4. **Main form card**
   - Cleaner field grouping.
   - Larger labels and inputs.
   - Explain “ใช้เวลา 30 วินาที”.
   - Strong privacy line near the form.

5. **Premium CTA band**
   - Explain price and unlock value.
   - “เริ่มฟรีก่อน - ค่อยปลดล็อกเมื่ออยากอ่านเต็ม”.

6. **Newsletter section**
   - Reframe as “รับจังหวะวันนี้ฟรีทุกเช้า”.
   - Make it secondary, after main report CTA.

7. **Trust footer**
   - Privacy, no birth data stored, manual payment/PIN model, contact/support note.

## Visual Direction

**Color tokens:**
- Background: near-black navy/purple `#09061c`, `#120a2d`
- Surface: translucent indigo `rgba(37, 24, 68, .72)`
- Surface elevated: `rgba(52, 34, 89, .82)`
- Accent gold: `#d6ad45`
- Accent soft: `#f4d987`
- Text primary: `#f8f1df`
- Text secondary: `#c9bddf`
- Border: `rgba(214, 173, 69, .22)`

**Typography:**
- Keep STARVIA logo serif if desired.
- Use a cleaner Thai body font stack or import a readable Thai font.
- Increase body text to 15-17px.
- Reduce letter spacing on Thai paragraphs.
- Use max width 60-68ch for text.

**UI rules:**
- One primary CTA style.
- One card radius system, e.g. 24px.
- Fewer dashed borders.
- Less centered microcopy.
- Replace low-contrast tiny labels with readable labels.
- Avoid too many equal-looking gold cards.

## Implementation Tasks

### Task 1: Create visual design tokens

**Objective:** Centralize the premium design language without changing behavior.

**Files:**
- Modify: `styles.css`
- Test: no behavior test; verify via build and visual smoke.

**Steps:**
1. Add/adjust `:root` variables for background, surfaces, gold, text, border, radius, shadow.
2. Replace repeated hardcoded colors where safe.
3. Keep existing class names to minimize JS risk.
4. Run `npm run check:js`.
5. Run `npm run build`.

**Verification:** homepage still loads, forms and mode buttons still work.

### Task 2: Refactor hero markup into clear value proposition

**Objective:** Make above-the-fold explain value and price faster.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Test: add/update landing label assertions if tests exist for visible text.

**Content direction:**
- Headline: `รู้จักตัวเองจากวันเกิด ไม่ใช่แค่ดูดวง`
- Subheadline: `STARVIA ช่วยถอดรหัสจุดแข็ง ความรัก งาน เงิน และจังหวะชีวิต ผ่านโหราศาสตร์ไทยโบราณแบบอ่านง่าย`
- CTA: `เริ่มดูดวงฟรี`
- Secondary: `ดูตัวอย่างพรีเมียม`
- Price badge: `Premium 199 บาท/เดือน`

**Verification:** hero fits first viewport on desktop and mobile.

### Task 3: Add “สิ่งที่คุณจะได้” value cards

**Objective:** Show concrete benefits before asking for data.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Cards:**
- `ตัวตน` - เห็นจุดแข็งและหลุมพรางของตัวเอง
- `ความรัก` - เข้าใจรูปแบบความสัมพันธ์ที่มักเกิดซ้ำ
- `งาน/เงิน` - รู้จังหวะควรลุย ชะลอ หรือเคลียร์เรื่องค้าง
- `ฤกษ์ดี` - เลือกวันที่เหมาะกับเรื่องสำคัญ

**Verification:** cards stack cleanly on mobile, no 3-column equal-card generic layout on desktop; prefer bento 2x2 or asymmetric grid.

### Task 4: Redesign main form card

**Objective:** Make the form feel safer, clearer, and more premium.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Changes:**
- Add small heading inside form: `เริ่มจากข้อมูลพื้นฐาน`
- Add helper: `ใช้เวลาไม่ถึง 30 วินาที`
- Make date field label clearer: `วันเกิด (ค.ศ.)`
- Keep time optional.
- Move privacy copy into a higher-contrast trust strip.

**Verification:** disabled/enabled button logic remains unchanged.

### Task 5: Add premium report preview section

**Objective:** Make Premium feel worth 199 THB before users generate a report.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Preview items:**
- `ฟรี` กำลังวันประจำตัว
- `ฟรี` สรุปตัวตนเบื้องต้น
- `Premium` แผนที่ชีวิตรายเดือน
- `Premium` สูตรเปิดดวงลาภลอย
- `Premium` กระจกกรรม / รูปแบบความสัมพันธ์

**Verification:** Premium is clearly valuable but not overpromising.

### Task 6: Reframe newsletter section

**Objective:** Make newsletter support retention rather than distract from main CTA.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Copy:**
- Title: `รับจังหวะวันนี้ฟรีทุกเช้า`
- Description: `อีเมลสั้น ๆ ที่ช่วยให้คุณรู้ว่าวันนี้ควรลุย ชะลอ หรือจัดการเรื่องไหนก่อน`

**Verification:** newsletter remains secondary to report generation.

### Task 7: Improve mobile layout

**Objective:** Make first action obvious on phone.

**Files:**
- Modify: `styles.css`

**Changes:**
- Mobile hero shorter.
- CTA sticky or near top after hero.
- Inputs full width.
- Mode tabs scroll horizontally if needed.
- Reduce decorative spacing.

**Verification:** inspect mobile viewport manually in browser.

### Task 8: Result-page readability pass

**Objective:** Improve perceived value after form submission.

**Files:**
- Inspect: `js/renderer-individual.js`, `js/renderer-shared.js`, `styles.css`
- Modify only CSS first if possible.

**Changes:**
- Stronger hierarchy between free and premium sections.
- Better spacing between locked cards.
- Clearer locked overlays.
- More readable Thai body copy.

**Verification:** generate a sample report locally and confirm locked/unlocked UI still works.

### Task 9: Add visual regression/smoke checklist

**Objective:** Prevent UI regression before deploy.

**Commands:**
```bash
npm test
npm run check:js
npm run build
npm start
curl -sI http://localhost:8787/
curl -sI http://localhost:8787/v1/health
```

**Manual smoke:**
- Open homepage.
- Switch all 3 modes.
- Fill individual report.
- Verify results render.
- Verify newsletter form still submits or fails gracefully.

### Task 10: Deploy safely

**Objective:** Push only after build and smoke pass.

**Commands:**
```bash
git diff --check
git status --short
git add index.html styles.css js/ tests/ docs/plans/2026-05-30-starvia-premium-ui-redesign.md
git commit -m "feat: redesign starvia premium landing experience"
git push origin master:main
```

**Production verification:**
```bash
curl -sI https://starvia-production.up.railway.app/
curl -s https://starvia-production.up.railway.app/v1/health
```

## Acceptance Criteria

- Homepage looks more premium and less cramped.
- Main value proposition is understandable within 5 seconds.
- Price `199 บาท/เดือน` appears before deep scroll.
- User knows what Free gives and what Premium unlocks.
- Main CTA is visually dominant.
- Thai text is readable on mobile.
- Existing form, mode tabs, newsletter, and premium unlock behavior remain functional.
- `npm test`, `npm run check:js`, and `npm run build` pass.

## Rollback Plan

If deploy breaks UI or behavior:
1. Revert last commit.
2. Push `master:main` to Railway.
3. Verify `/` and `/v1/health`.

## Notes

Do not redesign calculations, payment/PIN logic, newsletter backend, or astrology content in the first UI pass. Keep this release focused on perceived value, readability, and conversion.
