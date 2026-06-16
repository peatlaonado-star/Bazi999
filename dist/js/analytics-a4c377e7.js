// Starvia Analytics — Custom events for Umami + localStorage fallback
// ส่ง custom events ไป umami เพื่อ track conversion funnel

(function () {
  'use strict';

  // LocalStorage key for offline counter
  const LS_KEY = 'starvia_analytics';

  // Load existing counters
  let counters = {};
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) counters = JSON.parse(saved);
  } catch (e) {}

  // Initialize missing counters
  const events = [
    'birthday_submitted',   // ผู้ใช้กรอกวันเกิด
    'reading_viewed',       // เปิดดูผลคำทำนาย
    'premium_cta_clicked',  // กดปุ่ม "ดูดวงพรีเมียม"
    'premium_page_viewed',  // เปิดหน้า Premium
    'payment_initiated',    // เริ่มกระบวนการจ่ายเงิน
    'payment_completed',    // จ่ายเงินสำเร็จ
    'pin_verified',         // กรอก PIN ถูก
    'pin_invalid',          // กรอก PIN ผิด
    'share_initiated',      // กดแชร์
    'chat_opened',          // เปิด chat widget
    'chat_message_sent',    // ส่งข้อความใน chat
    'lottery_viewed',       // ดูผลหวย
    'streak_started',       // เริ่ม streak
    'reading_shared',       // แชร์คำทำนาย
    'tab_viewed',           // กดเปลี่ยน tab (ตัวตน/คู่สัมพันธ์/การงาน/การเงิน)
    'premium_popup_shown',  // เห็น popup พรีเมียม
    'ab_exposed',           // A/B test variant shown
  ];
  events.forEach((e) => {
    if (typeof counters[e] !== 'number') counters[e] = 0;
  });

  /**
   * Track event — ส่งไป umami + เก็บ local counter
   * @param {string} name - event name (one of events[])
   * @param {object} data - optional data object (e.g. { plan: 'premium_199' })
   */
  function track(name, data) {
    if (!events.includes(name)) {
      console.warn('[analytics] Unknown event:', name);
      return;
    }

    // Increment local counter
    counters[name] = (counters[name] || 0) + 1;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(counters));
    } catch (e) {}

    // Send to Umami (if loaded)
    try {
      if (typeof window.umami === 'object' && window.umami !== null && typeof window.umami.track === 'function') {
        window.umami.track(name, data || {});
      }
    } catch (e) {}

    // Debug log in dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[analytics]', name, data || {}, '(total:', counters[name] + ')');
    }
  }

  /**
   * Get local counters — ใช้สำหรับ admin dashboard
   */
  function getCounters() {
    return Object.assign({}, counters);
  }

  /**
   * Reset counters (admin only)
   */
  function reset() {
    events.forEach((e) => (counters[e] = 0));
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(counters));
    } catch (e) {}
  }

  // Expose
  window.StarviaAnalytics = { track, getCounters, reset, events };

  // ── Auto-track page views ──
  document.addEventListener('DOMContentLoaded', () => {
    // Reading page view
    if (window.location.pathname.includes('share.html') || document.getElementById('reading-result')) {
      track('reading_viewed');
    }
    // Premium page view
    if (document.querySelector('[data-premium]') || window.location.search.includes('premium=1')) {
      track('premium_page_viewed');
    }

    // ── Event delegation (ทำงานแม้ element ถูก inject ทีหลัง) ──
    document.addEventListener('submit', (e) => {
      // Onboarding form → birthday submitted
      const form = e.target;
      if (form && (form.id === 'onboarding-form' || form.id === 'starvia-form' || form.classList.contains('birthday-form'))) {
        track('birthday_submitted');
      }
    }, true);

    // Premium CTA clicks
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t) return;
      const matchText = (el) => (el.textContent || '').toLowerCase();
      const matchAttr = (el, attr) => (el.getAttribute(attr) || '').toLowerCase();

      // Premium CTA (data-premium attribute, or text contains premium/พรีเมียม/ปลดล็อก)
      if (
        t.matches('[data-premium], [data-premium-cta], .premium-cta, .btn-premium') ||
        /พรีเมียม|ปลดล็อก|premium|unlock/.test(matchText(t) + ' ' + matchAttr(t, 'data-action') + ' ' + matchAttr(t, 'aria-label'))
      ) {
        track('premium_cta_clicked');
      }

      // Share buttons
      if (
        t.matches('[data-share], .share-btn, .btn-share') ||
        matchAttr(t, 'data-action') === 'share' ||
        /แชร์|share/.test(matchText(t) + ' ' + matchAttr(t, 'data-action') + ' ' + matchAttr(t, 'aria-label'))
      ) {
        track('share_initiated');
      }

      // Payment open
      if (matchAttr(t, 'data-action') === 'open-payment' || /จ่ายเงิน|pay|ชำระ/.test(matchText(t) + ' ' + matchAttr(t, 'data-action'))) {
        track('payment_initiated');
      }
    }, true);

    // ── Tab view tracking ──
    document.addEventListener('click', (e) => {
      var tab = e.target.closest('.tab');
      if (tab) {
        var tabIndex = Array.prototype.indexOf.call(tab.parentNode.children, tab);
        var tabLabel = (tab.querySelector('.tab-text') || {}).textContent || 'tab-' + tabIndex;
        track('tab_viewed', { tab: tabLabel, index: tabIndex });
      }
    }, true);

    // ── Premium popup impression (MutationObserver, track once per session) ──
    var _popupTracked = false;
    var popupObserver = new MutationObserver(function (mutations) {
      if (_popupTracked) return;
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (_popupTracked) return;
          if (node.nodeType === 1) {
            if (node.matches && node.matches('.lock-overlay, .premium-popup, [data-premium-overlay]')) {
              _popupTracked = true;
              track('premium_popup_shown');
            }
            if (!_popupTracked && node.querySelectorAll) {
              if (node.querySelectorAll('.lock-overlay, .premium-popup, [data-premium-overlay]').length > 0) {
                _popupTracked = true;
                track('premium_popup_shown');
              }
            }
          }
        });
      });
    });
    popupObserver.observe(document.body, { childList: true, subtree: true });
  });
})();
