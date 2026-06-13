/**
 * Cosmic Events Banner — STARVIA
 * Shows current/upcoming astrological events as a subtle banner above the mode nav.
 * No Buddhist terminology — pure celestial/cosmic language.
 * Self-contained module, no dependencies on app.js or ui-actions.js.
 * 
 * Architecture:
 * - Pre-computed notable events for 2026–2027 (new/full moons, solstices, retrogrades)
 * - On DOMContentLoaded: check today's event → render banner if any
 * - Banner updates dynamically at midnight
 */

var CosmicEvents = (function() {
  'use strict';

  // ─── Event Database ───────────────────────────────────────────
  // Each event: { start, end? (optional), emoji, title, subtitle, cta? }
  // Dates: 'YYYY-MM-DD' format — compared lexicographically (ISO works)
  
  var EVENTS = [
    // June 2026
    { start: '2026-06-12', end: '2026-06-15', emoji: '💛', title: 'Venus เข้าราศีสิงห์', subtitle: 'พลังความรักเร่าร้อน — ดูดวงความรักวันนี้', cta: '♡ เช็กดวงคู่' },
    { start: '2026-06-14', end: '2026-06-16', emoji: '🌑', title: 'New Moon ในราศีเมถุน', subtitle: 'เริ่มต้นใหม่ — พลังงานรอบนี้เหมาะกับการเริ่มอะไรใหม่ๆ', cta: '✦ เปิดดวงชะตา' },
    { start: '2026-06-29', end: '2026-07-01', emoji: '🌕', title: 'Full Moon (Strawberry Moon)', subtitle: 'พลังถึงขีดสุด! ตรวจดูสิ่งที่เริ่มไว้เมื่อต้นเดือน' },
    
    // July 2026
    { start: '2026-07-09', end: '2026-07-12', emoji: '💛', title: 'Venus เข้าราศีกันย์', subtitle: 'ความรักรอบนี้เน้นจริงจัง วิเคราะห์ก่อนรัก', cta: '♡ เช็กดวงคู่' },
    { start: '2026-07-14', end: '2026-07-16', emoji: '🌑', title: 'New Moon ในราศีกรกฎ', subtitle: 'พลังบ้านและครอบครัว — ให้ความสำคัญกับคนรอบตัว' },
    { start: '2026-07-18', end: '2026-07-20', emoji: '🌟', title: 'พลูโต trine ยูเรนัส', subtitle: 'พลังเปลี่ยนแปลงครั้งใหญ่ ไอเดียใหม่ๆ ทะลุกรอบเดิม' },
    { start: '2026-07-29', end: '2026-07-31', emoji: '🌕', title: 'Full Moon', subtitle: 'ปล่อยวาง สิ้นสุดรอบ — เช็กดวงก่อนจบเดือน' },
    
    // August 2026
    { start: '2026-08-12', end: '2026-08-14', emoji: '🌑', title: 'New Moon ในราศีสิงห์', subtitle: 'พลังผู้นำ — เริ่มโปรเจกต์ที่อยากทำให้คนเห็น' },
    { start: '2026-08-22', end: '2026-08-25', emoji: '☿️', title: 'Mercury Retrograde ในราศีกันย์', subtitle: 'เช็กข้อมูล ย้อนกลับมาทบทวนก่อนตัดสินใจ' },
    { start: '2026-08-28', end: '2026-08-30', emoji: '🌕', title: 'Full Moon', subtitle: 'จังหวะปลดปล่อย — สิ่งที่ค้างคา ถึงเวลาปล่อยไป' },
    
    // September 2026
    { start: '2026-09-10', end: '2026-09-12', emoji: '🌑', title: 'New Moon ในราศีกันย์', subtitle: 'พลังจัดระบบ — จัดระเบียบชีวิตให้เป็นระเบียบ' },
    { start: '2026-09-22', end: '2026-09-24', emoji: '🌍', title: 'Vernal Equinox (ฤดูใบไม้ผลิ)', subtitle: 'กลางวันเท่ากลางคืน — จุดสมดุลของธรรมชาติ' },
    { start: '2026-09-27', end: '2026-09-29', emoji: '🌕', title: 'Full Moon', subtitle: 'เก็บเกี่ยวผล — เช็กดวงสิ่งที่ลงมือทำไว้' },

    // October 2026
    { start: '2026-10-10', end: '2026-10-12', emoji: '🌑', title: 'New Moon ในราศีตุลย์', subtitle: 'พลังสมดุลและความสัมพันธ์ — รอบดีๆ ของความรัก' },
    { start: '2026-10-15', end: '2026-10-18', emoji: '♄', title: 'พลูโตจบ Retrograde', subtitle: 'จบช่วงทบทวนลึก — เดินหน้าต่ออย่างมีพลัง' },
    { start: '2026-10-27', end: '2026-10-29', emoji: '🌕', title: 'Full Moon', subtitle: 'ปลดปล่อยรอบก่อน Halloween — พลังแรง!เปิดดวง' },
    
    // November 2026
    { start: '2026-11-08', end: '2026-11-10', emoji: '🌑', title: 'New Moon ในราศีพิจิก', subtitle: 'พลังลึก สัญชาตญาณแม่น — ฟังเสียงข้างใน' },
    { start: '2026-11-26', end: '2026-11-28', emoji: '🌕', title: 'Full Moon', subtitle: 'รู้แจ้ง — สิ่งที่ซ่อนอยู่จะเปิดเผย' },
    { start: '2026-11-29', end: '2026-12-01', emoji: '🌟', title: 'พลูโต trine ยูเรนัส (ครั้งที่ 2)', subtitle: 'พลังปฏิวัติซ้ำรอบสอง — ถึงเวลาเปลี่ยนเกม!' },
    
    // December 2026
    { start: '2026-12-08', end: '2026-12-10', emoji: '🌑', title: 'New Moon ในราศีธนู', subtitle: 'พลังผจญภัย — เริ่มเรียนรู้หรือเดินทางครั้งใหม่' },
    { start: '2026-12-21', end: '2026-12-23', emoji: '❄️', title: 'Winter Solstice', subtitle: 'กลางคืนยาวนานที่สุด — พลังเงียบสงบ เตรียมพร้อมปีใหม่' },
    { start: '2026-12-26', end: '2026-12-28', emoji: '🌕', title: 'Full Moon', subtitle: 'ปิดท้ายปี — เช็กดวงก่อนก้าวสู่ปีใหม่' },
  ];

  // ─── Core Logic ───────────────────────────────────────────────

  /** Get today's date as YYYY-MM-DD */
  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** Find the first event covering today */
  function getCurrentEvent() {
    var today = todayISO();
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      var start = e.start;
      var end = e.end || e.start;  // single-day event if no end
      if (today >= start && today <= end) {
        return e;
      }
    }
    return null;
  }

  /** Get the next upcoming event (for "coming soon" state) */
  function getNextEvent() {
    var today = todayISO();
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].start > today) {
        return EVENTS[i];
      }
    }
    return EVENTS[0];  // wrap to next year's first event
  }

  // ─── Rendering ─────────────────────────────────────────────────

  function renderBanner() {
    var event = getCurrentEvent();
    if (!event) {
      // No event today — try "upcoming" style
      renderNextUpcoming();
      return;
    }

    var banner = createBannerElement(event.emoji, event.title, event.subtitle, event.cta);
    insertBanner(banner);
  }

  function renderNextUpcoming() {
    var next = getNextEvent();
    if (!next) return;

    var banner = createBannerElement(
      next.emoji,
      'Coming Soon: ' + next.title,
      next.subtitle,
      null,
      true  // subtle mode
    );
    insertBanner(banner);
  }

  function createBannerElement(emoji, title, subtitle, cta, subtle) {
    var div = document.createElement('div');
    div.className = 'cosmic-event-banner' + (subtle ? ' is-upcoming' : '');

    var inner = '<span class="ceb-emoji">' + emoji + '</span>';
    inner += '<span class="ceb-text">';
    inner += '<span class="ceb-title">' + escapeHTML(title) + '</span>';
    if (subtitle) {
      inner += '<span class="ceb-subtitle">' + escapeHTML(subtitle) + '</span>';
    }
    inner += '</span>';

    if (cta) {
      var ctaLink = '#fc0';
      if (cta.indexOf('♡') !== -1) ctaLink = '#fc1';  // couple mode
      inner += '<a class="ceb-cta" href="' + ctaLink + '">' + escapeHTML(cta) + '</a>';
    }

    div.innerHTML = inner;
    return div;
  }

  function insertBanner(bannerEl) {
    // Insert after .hd (hero), before .modenav
    var hero = document.querySelector('.hd');
    var modeNav = document.querySelector('.modenav');
    
    if (hero && modeNav) {
      hero.parentNode.insertBefore(bannerEl, modeNav);
    } else if (hero) {
      hero.parentNode.insertBefore(bannerEl, hero.nextSibling);
    } else {
      // Fallback: prepend to body
      document.body.insertBefore(bannerEl, document.body.firstChild);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Init ──────────────────────────────────────────────────────

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderBanner);
    } else {
      renderBanner();
    }
  }

  // Expose for debugging/testing
  CosmicEvents = {
    getCurrentEvent: getCurrentEvent,
    getNextEvent: getNextEvent,
    renderBanner: renderBanner,
  };

  init();
  return CosmicEvents;
})();
