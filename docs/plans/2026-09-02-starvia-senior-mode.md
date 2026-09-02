# STARVIA Senior Mode — Implementation Plan (2 ก.ย.69)

> **For Hermes:** พ่อสั่ง "เริ่มงาน STARVIA สูงวัย ตาม spec บน Desktop" — spec อนุมัติแล้ว
> (Desktop/STARVIA-Senior-Mode-Spec.md)

**Goal:** เพิ่ม age gate (60+) + โหมด senior (ตัวใหญ่ อ่านง่าย) ในเว็บ STARVIA หน้าเดียว ไม่แยก URL, โหมดปกติไม่ regress

**Architecture:** CSS class บน `<body>` (body.senior / body.normal) + overlay age gate แรกเข้า + fixed toggle bar ล่าง. ใช้หลัก "redefine CSS variables + override class หลัก" ไม่ global replace 534 font-size decls.

**Tech Stack:** Vite (vanilla JS), CSS variables, localStorage, Cloudflare Pages (starvia / starvia.website) — source=GitHub, deploy ผ่าน commit+push + scripts/deploy.py

---

## สิ่งห้าม
- ห้ามแตะงานค้าง t-014..t-018 (CTA PIN etc.)
- ⚠️ ห้าม `document.body.className = ...` — app.js ใช้ classList.add('has-report') → ใช้ classList.add/remove เท่านั้น
- ห้าม global replace font-size — ต่อท้ายไฟล์ CSS ด้วยบล็อก body.senior
- hero ของเว็บจริงเป็นวิดีโอ/ภาพมืด (hero-splash) → ห้าม override ตัวหนังสือใน hero เป็นดำ

## ไฟล์ที่แก้ (deploy 2 ก.ย.69 รอบ production จริง)
- `index.html` — age gate + inline script (หลัง `<body>`), toggle bar (ก่อน `</body>`), bump ?v=2.0.5→2.0.6 + APP_VERSION
- `styles.css` — ต่อท้าย: age gate + toggle bar + body.senior overrides (forms/nav/cards/df/sp/value/results/footer .site-footer) + media 480/landscape
- `css/tarot.css` — ต่อท้าย: body.senior tarot overrides
- (share-viral.js ไม่ต้องแก้ — remote มี guard แล้ว)

## ตัวเลข QA ที่ผ่าน (computed style ของจริง 390px)
- body bg #fff8d6, font 18px, color #000 · label 18px · input 18px border 2px #000 bg #fff
- .btn 19px min-height 56px radius 50px border 3px · .mnb 17px/50px gold active
- toggle bar fixed ไม่ overflow (390px) · ปุ่ม 17px/50px
- localStorage จำได้ วนครบ (เลือก→สลับ→reload→ลบ→ถามใหม่)
- console error 0

## Deploy flow
1. `git checkout -b senior-clean origin/main` (ได้ remote ล่าสุด 8f7cb2d, หลีกเลี่ยง rebase CRLF mess ของ working tree เก่า)
2. apply edits → `npm run build` → QA (playwright + screenshots) → `git push origin senior-clean:main`
3. `python3 scripts/deploy.py --wait --verify --verify-token '.agegate'`
4. curl prod + playwright check prod

## Pitfalls ที่เจอ
- port 8788 มี http.server เก่าค้าง → ของใหม่ bind ไม่ได้ → ดูเหมือนหน้าไม่เปลี่ยน (kill เก่าก่อน)
- working tree เก่า (main ท้องถิ่น) เป็น CRLF + ล้าหลัง remote 15 commits → ห้าม deploy จาก dist ของ working tree เก่า (จะพาโค้ดเก่ากลับขึ้น prod) — ใช้ branch จาก origin/main เสมอ