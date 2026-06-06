// ===== STARVIA ONBOARDING JOURNEY ENGINE =====
// Day 0-5+ experience: Welcome → Birth Data → First Reading → Daily Fortune → Premium CTA
// Uses localStorage to track journey progress across sessions

var Onboarding = (function() {
  'use strict';

  var STORAGE_KEY = 'starvia_onboarding';
  function getLS() { return (typeof localStorage !== 'undefined') ? localStorage : (window && window.localStorage); }

  // ===== Helpers =====
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeJSON(str) {
    try { return JSON.parse(str); } catch(e) { return null; }
  }

  function daysBetween(d1, d2) {
    var t1 = new Date(d1).getTime();
    var t2 = new Date(d2).getTime();
    if (isNaN(t1) || isNaN(t2)) return 0;
    return Math.floor((t2 - t1) / 86400000);
  }

  // ===== State Management =====
  function getState() {
    var raw = getLS().getItem(STORAGE_KEY);
    var data = safeJSON(raw);
    if (!data || typeof data.step !== 'number') {
      return { step: 0, startedAt: null, birthData: null };
    }
    return {
      step: data.step,
      startedAt: data.startedAt || null,
      birthData: data.birthData || null,
    };
  }

  function saveState(state) {
    getLS().setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ===== Public API =====

  function startOnboarding() {
    saveState({
      step: 0,
      startedAt: new Date().toISOString(),
      birthData: null,
    });
  }

  function saveBirthData(data) {
    var current = getState();
    saveState({
      step: 1,
      startedAt: current.startedAt || new Date().toISOString(),
      birthData: {
        name: escapeHTML(data.name || ''),
        dob: data.dob || '',
        time: data.time || '',
        gender: data.gender || '',
      },
    });
  }

  function advanceStep() {
    var current = getState();
    saveState({
      step: current.step + 1,
      startedAt: current.startedAt,
      birthData: current.birthData,
    });
  }

  function getJourneyDay() {
    var state = getState();
    if (!state.startedAt) return 0;
    return daysBetween(state.startedAt, new Date().toISOString());
  }

  function getPhase() {
    var day = getJourneyDay();
    var state = getState();
    if (state.step === 0 || !state.startedAt) return 'welcome';
    if (day <= 0) return 'first-reading';
    if (day === 1) return 'anticipation';
    if (day === 2) return 'wow-day';
    if (day >= 3 && day <= 4) return 'continuity';
    if (day >= 5 && day <= 9) return 'weekly-summary';
    return 'premium-offer';
  }

  function getStreak() {
    var day = getJourneyDay();
    return Math.min(day, 30);
  }

  function isOnboarded() {
    var state = getState();
    return !!(state.birthData && state.birthData.name);
  }

  function reset() {
    getLS().removeItem(STORAGE_KEY);
  }

  // ===== Rendering Helpers =====

  function renderProgressBar(currentStep, totalSteps) {
    var pct = Math.round((currentStep / totalSteps) * 100);
    return '<div class="ob-progress">'
      + '<div class="ob-progress-bar" style="width:' + pct + '%"></div>'
      + '<span class="ob-progress-text">' + currentStep + '/' + totalSteps + '</span>'
      + '</div>';
  }

  function renderWelcomeScreen() {
    // Pull live review count from SocialProof so the "ร่วมกับผู้ใช้ X คน"
    // figure stays in sync with the homepage counter. Fall back to a
    // sane default if SocialProof hasn't loaded yet (e.g. before DOMContentLoaded).
    var socialProof = (typeof SocialProof !== 'undefined' && SocialProof.getReviewCount)
      ? SocialProof.getReviewCount()
      : 2373;
    var formatted = socialProof.toLocaleString('th-TH');

    return '<div class="ob-overlay" id="onboarding-overlay">'
      + '<div class="ob-card ob-welcome">'
      + '<div class="ob-logo">✦ STARVIA ✦</div>'
      + '<h2 class="ob-title">✨ ค้นพบตัวตนที่แท้จริง<br>ใน 30 วินาที</h2>'
      + '<p class="ob-subtitle">ระบบอ่านแผนที่ชีวิตด้วยโหราศาสตร์ไทย สำหรับคนยุคใหม่</p>'
      + '<div class="ob-social-proof">'
      + '🌟 ร่วมกับผู้ใช้ <strong>' + formatted + '</strong> คน<br>'
      + '<span class="ob-social-sub">ที่ค้นพบดวงของตัวเองแล้ว · 4.8★ (2,373 รีวิว)</span>'
      + '</div>'
      + '<div class="ob-features">'
      + '<div class="ob-feature">🌟 พิมพ์เขียวชีวิตไทย — รู้จักตัวเองลึกกว่าเดิม</div>'
      + '<div class="ob-feature">🔮 ดวงรายวัน — ทุกวันมีคำทำนายส่วนตัว</div>'
      + '<div class="ob-feature">💕 ดูดวงคู่ — เข้าใจความสัมพันธ์</div>'
      + '</div>'
      + '<button class="ob-btn ob-btn-primary" data-action="onboarding-next">🔮 เปิดดวงชะตา →</button>'
      + '<button class="ob-btn ob-btn-secondary" data-action="onboarding-preview">👁️ ดูตัวอย่างก่อน</button>'
      + '<p class="ob-hint">ใช้เวลาไม่ถึง 30 วินาที · ไม่ต้องสมัครสมาชิก</p>'
      + '</div>'
      + '</div>';
  }

  function renderBirthForm() {
    return '<div class="ob-overlay" id="onboarding-overlay">'
      + '<div class="ob-card ob-form">'
      + renderProgressBar(1, 3)
      + '<h2 class="ob-title">เล่าเรื่องของคุณให้ดาวฟัง ✦</h2>'
      + '<p class="ob-subtitle">กรอกข้อมูลเพื่อให้ผลทำนายแม่นยำที่สุด</p>'
      + '<form id="onboarding-form" class="ob-form-fields">'
      + '<div class="ob-field">'
      + '<label class="ob-label">ชื่อของคุณ</label>'
      + '<input type="text" class="ob-input" name="name" placeholder="เช่น คาร่า" required maxlength="100">'
      + '</div>'
      + '<div class="ob-field">'
      + '<label class="ob-label">วันเกิด</label>'
      + '<input type="date" class="ob-input" name="dob" required>'
      + '</div>'
      + '<div class="ob-field">'
      + '<label class="ob-label">เวลาเกิด <span class="ob-optional">(ถ้ารู้)</span></label>'
      + '<input type="time" class="ob-input" name="time">'
      + '<p class="ob-hint-small">⏱ เวลาเกิดช่วยให้ลัคนาแม่นยำขึ้น</p>'
      + '</div>'
      + '<div class="ob-field">'
      + '<label class="ob-label">เพศ</label>'
      + '<div class="ob-radio-group">'
      + '<label class="ob-radio"><input type="radio" name="gender" value="female"> หญิง</label>'
      + '<label class="ob-radio"><input type="radio" name="gender" value="male"> ชาย</label>'
      + '<label class="ob-radio"><input type="radio" name="gender" value="other"> อื่นๆ</label>'
      + '</div>'
      + '</div>'
      + '<button type="submit" class="ob-btn ob-btn-primary">เปิดดวงของคุณ ✦</button>'
      + '</form>'
      + '</div>'
      + '</div>';
  }

  function renderFirstReading(birthData) {
    var name = birthData ? birthData.name : 'คุณ';
    return '<div class="ob-overlay ob-overlay-soft" id="onboarding-overlay">'
      + '<div class="ob-card ob-reading">'
      + '<div class="ob-reading-badge">🌟 วันแรกของคุณบน STARVIA</div>'
      + '<h2 class="ob-title">ยินดีต้อนรับ ' + escapeHTML(name) + '</h2>'
      + '<p class="ob-subtitle">นี่คือดวงของคุณ — วันแรกที่ STARVIA ได้พบคุณ</p>'
      + '<div class="ob-reading-teaser">'
      + '<p>🔮 ผลทำนายวันแรกของคุณพร้อมแล้ว</p>'
      + '<p class="ob-hint">เลื่อนลงไปดูผลทำนายด้านล่างได้เลยค่ะ</p>'
      + '</div>'
      + '<div class="ob-reading-preview">'
      + '<div class="ob-preview-item">✦ ดาวเจ้าชะตาของคุณกำลังรอ</div>'
      + '<div class="ob-preview-item">✦ ธาตุชีวิตบอกตัวตนที่แท้จริง</div>'
      + '<div class="ob-preview-item">✦ สีมงคลและตัวเลขนำโชคประจำวัน</div>'
      + '</div>'
      + '<button class="ob-btn ob-btn-secondary" data-action="onboarding-dismiss">ดูผลทำนายด้านล่าง ↓</button>'
      + '</div>'
      + '</div>';
  }

  function renderAnticipation(streak) {
    return '<div class="ob-banner" id="onboarding-banner">'
      + '<div class="ob-banner-content">'
      + '<span class="ob-banner-icon">🔮</span>'
      + '<span class="ob-banner-text">วันนี้ดาวมีการเคลื่อนไหว — ดวงของคุณกำลังจะเปลี่ยน!</span>'
      + '<span class="ob-banner-day">Day ' + (streak + 1) + '</span>'
      + '</div>'
      + '</div>';
  }

  function renderWowDay(streak) {
    return '<div class="ob-banner ob-banner-wow" id="onboarding-banner">'
      + '<div class="ob-banner-content">'
      + '<span class="ob-banner-icon">✨</span>'
      + '<span class="ob-banner-text">วันนี้คือวันพิเศษของคุณ — ดาวกำลังส่งสัญญาณสำคัญ!</span>'
      + '<span class="ob-banner-day">Day ' + (streak + 1) + ' 🔥</span>'
      + '</div>'
      + '</div>';
  }

  function renderStreakCounter(streak) {
    if (streak < 2) return '';
    var fireEmoji = streak >= 7 ? '🔥🔥🔥' : streak >= 3 ? '🔥🔥' : '🔥';
    return '<div class="ob-streak">'
      + '<span class="ob-streak-count">' + streak + ' วัน</span>'
      + '<span class="ob-streak-label">ดูดวงต่อเนื่อง ' + fireEmoji + '</span>'
      + '</div>';
  }

  function renderPremiumCTA(streak) {
    // Use StreakReward (single source of truth) so "ดูดวงมา X วัน" matches
    // the unlock counter and the countdown lines up.
    var day = streak + 1;
    // Trial offer: Day 7 unlocks the streak reward, Day 11 unlocks the free
    // trial countdown ends. Show countdown for the full week so the goal is
    // always visible.
    var rewardDay = 7;
    var trialEndsDay = 11;
    var rewardRemaining = Math.max(0, rewardDay - day);
    var trialRemaining = Math.max(0, trialEndsDay - day);

    // Has the user already unlocked the streak reward this cycle?
    var alreadyUnlocked = (typeof StreakReward !== 'undefined')
      ? StreakReward.isPremiumUnlocked() : false;
    var rewardExpired = (typeof StreakReward !== 'undefined')
      ? StreakReward.isPremiumExpired() : false;

    var teaserHtml = '<div class="ob-premium-teaser">'
      + '<p>🔒 ปลดล็อกผลทำนายเชิงลึก</p>'
      + '<p class="ob-premium-price">199 บาท/เดือน</p>';

    if (day >= 7 && alreadyUnlocked) {
      // Premium is currently active — confirm it
      teaserHtml += '<p class="ob-hint ob-hint-active">✦ Premium เปิดใช้งานแล้ว — ใช้ได้อีก 24 ชม.</p>';
    } else if (day >= 7 && rewardExpired) {
      // Free trial used → upsell
      teaserHtml += '<p class="ob-hint">ทดลองใช้ Premium 1 วันไปแล้ว — สมัครต่อเพียง 159 บาท/เดือน</p>';
    } else if (day >= 7) {
      // Eligible to claim
      teaserHtml += '<p class="ob-hint ob-hint-claim">🎁 ครบ 7 วันแล้ว! กดรับ Premium ฟรี 1 วัน →</p>';
    } else {
      // Pre-claim countdown
      teaserHtml += '<p class="ob-hint">ทดลอง Premium ฟรี 1 วัน — อีก ' + rewardRemaining + ' วัน!</p>';
      teaserHtml += '<div class="ob-reward-preview">'
        + '<span class="ob-reward-mini-badge">✦ PREMIUM 1 วัน</span>'
        + '<span class="ob-reward-mini-desc">ปลดล็อกดวงเต็ม · ลาภลอย · หมอทัก</span>'
        + '</div>';
    }

    teaserHtml += '</div>';

    // Day 11+: full offer for the 3-day free trial
    if (day >= 11) {
      teaserHtml = '<div class="ob-premium-teaser ob-premium-offer">'
        + '<div class="ob-premium-badge">🎁 ข้อเสนอพิเศษ</div>'
        + '<p>ทดลอง Premium ฟรี 3 วัน!</p>'
        + '<p class="ob-premium-price">199 บาท/เดือน (หลังทดลอง)</p>'
        + '<button class="ob-btn ob-btn-premium" data-action="onboarding-premium">ปลดล็อกทุกอย่าง →</button>'
        + '</div>';
    }

    return teaserHtml;
  }

  function renderWeeklySummary(streak) {
    return '<div class="ob-weekly" id="onboarding-weekly">'
      + '<div class="ob-weekly-header">'
      + '<h3>📊 สรุปสัปดาห์ที่ ' + Math.ceil((streak + 1) / 7) + '</h3>'
      + '<p>คุณดูดวงมา ' + (streak + 1) + ' วันแล้ว</p>'
      + '</div>'
      + '<div class="ob-weekly-content">'
      + '<p>🔮 สัปดาห์นี้ดาวของคุณเดินทางผ่านหลายตำแหน่ง</p>'
      + '<p>💡 สิ่งที่โดดเด่น: ดวงการเงินมีแนวโน้มดีขึ้น</p>'
      + '<p>⚡ สิ่งที่ต้องระวัง: อารมณ์อาจขึ้นลงในช่วงกลางสัปดาห์</p>'
      + '</div>'
      + renderPremiumCTA(streak)
      + '</div>';
  }

  // ===== Main Init =====
  function init() {
    var state = getState();
    var phase = getPhase();
    var streak = getStreak();

    // Check if overlay already exists
    var existing = document.getElementById('onboarding-overlay');
    if (existing) return;

    // If user already has birth data, auto-fill form and trigger reading
    if (state.birthData && state.birthData.name && state.step >= 1) {
      var n0 = document.getElementById('n0');
      var d0 = document.getElementById('d0');
      var t0 = document.getElementById('t0');
      var g0 = document.getElementById('g0');
      if (n0 && !n0.value) n0.value = state.birthData.name;
      if (d0 && !d0.value) d0.value = state.birthData.dob;
      if (t0 && state.birthData.time && !t0.value) t0.value = state.birthData.time;
      if (g0 && state.birthData.gender && !g0.value) g0.value = state.birthData.gender;
      // Auto-trigger reading if form has data but reading hasn't started
      if (n0 && n0.value && d0 && d0.value) {
        setTimeout(function() { go0(); }, 300);
      }
    }

    switch (phase) {
      case 'welcome':
        document.body.insertAdjacentHTML('beforeend', renderWelcomeScreen());
        break;
      case 'first-reading':
        // Skip overlay — reading will be triggered via auto-fill above
        break;
      // Other phases are handled via banners/inline elements, not full overlays
    }

    // Add streak counter if applicable
    if (streak >= 2 && phase !== 'welcome') {
      var streakHtml = renderStreakCounter(streak);
      if (streakHtml) {
        document.body.insertAdjacentHTML('afterbegin', streakHtml);
      }
    }

    // Add phase-specific banners
    if (phase === 'anticipation') {
      document.body.insertAdjacentHTML('afterbegin', renderAnticipation(streak));
    } else if (phase === 'wow-day') {
      document.body.insertAdjacentHTML('afterbegin', renderWowDay(streak));
    } else if (phase === 'weekly-summary') {
      document.body.insertAdjacentHTML('afterbegin', renderWeeklySummary(streak));
    } else if (phase === 'premium-offer') {
      document.body.insertAdjacentHTML('afterbegin', renderPremiumCTA(streak));
    }

    // Bind event handlers
    document.addEventListener('click', function(e) {
      var action = e.target.getAttribute('data-action');
      if (action === 'onboarding-next') {
        var overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
          overlay.outerHTML = renderBirthForm();
          bindFormHandler();
        }
      } else if (action === 'onboarding-dismiss') {
        var ob = document.getElementById('onboarding-overlay');
        if (ob) ob.remove();
        advanceStep();
      } else if (action === 'onboarding-preview') {
        // Soft dismiss — close the welcome overlay WITHOUT marking the
        // onboarding as started. The user can browse the landing page
        // (daily fortune, social proof, value sections) before deciding
        // to start the birth-data flow. Re-shows on next visit.
        try { localStorage.removeItem('onboarding_previewed'); } catch(e) {}
        var pv = document.getElementById('onboarding-overlay');
        if (pv) pv.remove();
        // Smooth-scroll to the value section so the user lands on context,
        // not the top of the page (which would feel like the overlay is
        // still hovering over the content).
        var valueSection = document.querySelector('.value-section');
        if (valueSection && typeof valueSection.scrollIntoView === 'function') {
          valueSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 600, behavior: 'smooth' });
        }
      } else if (action === 'onboarding-premium') {
        window.location.hash = '#premium';
      }
    });
  }

  function bindFormHandler() {
    var form = document.getElementById('onboarding-form');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name = (fd.get('name') || '').trim();
      var dob = fd.get('dob') || '';
      var time = (fd.get('time') || '').trim();
      var gender = (fd.get('gender') || '').trim();
      if (!name || !dob) return;
      saveBirthData({ name: name, dob: dob, time: time, gender: gender });

      // Close overlay
      var overlay = document.getElementById('onboarding-overlay');
      if (overlay) overlay.remove();

      // Fill the main STARVIA form and trigger reading
      var n0 = document.getElementById('n0');
      var d0 = document.getElementById('d0');
      var t0 = document.getElementById('t0');
      var g0 = document.getElementById('g0');
      if (n0) n0.value = name;
      if (d0) d0.value = dob;
      if (t0 && time) t0.value = time;
      if (g0 && gender) g0.value = gender;

      // Trigger the reading engine
      if (typeof go0 === 'function') {
        setTimeout(function() { go0(); }, 100);
      }
    });
  }

  // ===== Public API =====
  var api = {
    getState: getState,
    startOnboarding: startOnboarding,
    saveBirthData: saveBirthData,
    advanceStep: advanceStep,
    getJourneyDay: getJourneyDay,
    getPhase: getPhase,
    getStreak: getStreak,
    isOnboarded: isOnboarded,
    reset: reset,
    init: init,
    escapeHTML: escapeHTML,
    renderWelcomeScreen: renderWelcomeScreen,
    renderBirthForm: renderBirthForm,
    renderFirstReading: renderFirstReading,
    renderAnticipation: renderAnticipation,
    renderWowDay: renderWowDay,
    renderStreakCounter: renderStreakCounter,
    renderPremiumCTA: renderPremiumCTA,
    renderWeeklySummary: renderWeeklySummary,
  };

  return api;
})();

// Expose to window (needed for both browser and VM test contexts)
if (typeof window !== 'undefined') { window.Onboarding = Onboarding; }
