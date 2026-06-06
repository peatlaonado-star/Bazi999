// ═══ STARVIA 7-Day Streak Reward System ═══
// Track consecutive daily visits → unlock Premium 1 day → offer discount

(function() {
  'use strict';

  var STREAK_KEY = 'starvia_streak';
  var PREMIUM_UNLOCK_KEY = 'starvia_streak_premium';
  var DISCOUNT_OFFERED_KEY = 'starvia_streak_discount';

  // Get today's date string (YYYY-MM-DD in local timezone)
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  // Get streak data from localStorage
  function getStreak() {
    try {
      var raw = localStorage.getItem(STREAK_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { count: 0, lastDate: null, startDate: null };
  }

  // Save streak data
  function saveStreak(data) {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)); } catch(e) {}
  }

  // Calculate days between two date strings
  function daysBetween(d1, d2) {
    var a = new Date(d1 + 'T00:00:00');
    var b = new Date(d2 + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  // Update streak — uses Onboarding journey day (consecutive since signup)
  // so the UI text "ดูดวงมา X วัน" matches the unlock counter.
  function updateStreak() {
    var streak = { count: 0, lastDate: null, startDate: null };

    // Try to read from Onboarding state first (single source of truth)
    try {
      var raw = localStorage.getItem('starvia_onboarding');
      if (raw) {
        var ob = JSON.parse(raw);
        if (ob && ob.startedAt) {
          var startedAt = new Date(ob.startedAt);
          if (!isNaN(startedAt.getTime())) {
            var today = new Date(todayStr() + 'T00:00:00');
            var day = Math.max(0, Math.floor((today - startedAt) / 86400000));
            // day 0 = signup day, day 1 = next day, etc. Reward unlocks at day 7.
            streak.count = day + 1;
            streak.startDate = ob.startedAt;
            streak.lastDate = todayStr();
            return streak;
          }
        }
      }
    } catch (e) { /* fall through to legacy */ }

    // Legacy: consecutive day count from localStorage (back-compat for users
    // who somehow landed here before the Onboarding flow set up state).
    var legacy = { count: 0, lastDate: null, startDate: null };
    try {
      var rawLegacy = localStorage.getItem(STREAK_KEY);
      if (rawLegacy) legacy = JSON.parse(rawLegacy);
    } catch (e) {}
    var today = todayStr();
    if (legacy.lastDate === today) return legacy;
    var gap = legacy.lastDate ? daysBetween(legacy.lastDate, today) : 999;
    if (gap === 1) legacy.count += 1;
    else if (gap > 1) { legacy.count = 1; legacy.startDate = today; }
    legacy.lastDate = today;
    if (!legacy.startDate) legacy.startDate = today;
    saveStreak(legacy);
    return legacy;
  }

  // Check if Premium is currently unlocked via streak
  function isPremiumUnlocked() {
    try {
      var raw = localStorage.getItem(PREMIUM_UNLOCK_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      var now = Date.now();
      return data.unlocked && data.expiresAt > now;
    } catch(e) {}
    return false;
  }

  // Unlock Premium for 24 hours
  function unlockPremium() {
    var expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    try {
      localStorage.setItem(PREMIUM_UNLOCK_KEY, JSON.stringify({
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        expiresAt: expiresAt
      }));
    } catch(e) {}
  }

  // Check if Premium was unlocked but now expired.
  // IMPORTANT: only return true if the user has actually earned a 7-day
  // streak unlock. Stale localStorage (e.g. from a previous session, test
  // data, or pre-Day-1 debugging) must not surface the "Premium expired"
  // banner before Day 7 — that message is meaningless to a Day 1 user.
  function isPremiumExpired() {
    try {
      var raw = localStorage.getItem(PREMIUM_UNLOCK_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data.unlocked) return false;
      if (data.expiresAt > Date.now()) return false; // still active
      var streak = getStreak();
      return streak.count >= 7;
    } catch(e) {}
    return false;
  }

  // Check if discount was already offered
  function isDiscountOffered() {
    try {
      return localStorage.getItem(DISCOUNT_OFFERED_KEY) === 'true';
    } catch(e) {}
    return false;
  }

  // Mark discount as offered
  function markDiscountOffered() {
    try { localStorage.setItem(DISCOUNT_OFFERED_KEY, 'true'); } catch(e) {}
  }

  // Get time remaining for Premium unlock
  function getPremiumTimeRemaining() {
    try {
      var raw = localStorage.getItem(PREMIUM_UNLOCK_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var remaining = data.expiresAt - Date.now();
      if (remaining <= 0) return null;
      var hours = Math.floor(remaining / 3600000);
      var mins = Math.floor((remaining % 3600000) / 60000);
      return hours + ' ชม. ' + mins + ' นาที';
    } catch(e) {}
    return null;
  }

  // Build streak progress bar HTML — shows users EXACTLY what reward they'll
  // get when they hit 7 days, so the goal is visible before the popup fires.
  function buildStreakProgress(streak) {
    var count = streak.count;
    var target = 7;
    var percent = Math.min(100, Math.round((count / target) * 100));
    var remaining = Math.max(0, target - count);

    // Don't show if already used the reward
    if (isPremiumExpired() || isDiscountOffered()) return '';

    // Don't show if currently unlocked
    if (isPremiumUnlocked()) return '';

    if (count < 1) return '';

    var message = '';
    if (count >= 7) {
      message = '🎉 ยินดีด้วย! ครบ 7 วันแล้ว!';
    } else if (count >= 5) {
      message = '🔥 เกือบถึงแล้ว! อีก ' + remaining + ' วัน!';
    } else if (count >= 3) {
      message = '💪 ต่อเนื่อง ' + count + ' วัน — อีก ' + remaining + ' วัน!';
    } else {
      message = '✨ เข้าต่อเนื่อง ' + count + '/' + target + ' วัน';
    }

    var dots = '';
    for (var i = 1; i <= target; i++) {
      var filled = i <= count;
      dots += '<span class="streak-dot' + (filled ? ' filled' : '') + '">';
      dots += filled ? '★' : '☆';
      dots += '</span>';
    }

    // Reward preview — always visible so users know what they're working toward
    var rewardPreview = ''
      + '<div class="streak-reward-card">'
      + '<div class="streak-reward-icon">🎁</div>'
      + '<div class="streak-reward-body">'
      + '<div class="streak-reward-title">ครบ 7 วัน — รับฟรีทันที!</div>'
      + '<div class="streak-reward-detail">'
      + '<span class="streak-reward-badge">✦ PREMIUM 1 วัน</span>'
      + '<span class="streak-reward-desc">ปลดล็อกดวงเต็ม · ลาภลอย · หมอทัก · คัมภีร์ 6 ด้าน</span>'
      + '</div>'
      + (count >= 7
          ? '<button class="streak-reward-cta" onclick="StreakReward.claimReward()">🔓 รับรางวัลเลย</button>'
          : '<div class="streak-reward-progress">'
            + '<div class="streak-reward-bar-wrap">'
            + '<div class="streak-reward-bar" style="width:' + percent + '%"></div>'
            + '</div>'
            + '<div class="streak-reward-count">' + count + '/' + target + ' วัน</div>'
            + '</div>')
      + '</div>'
      + '</div>';

    return '<div class="streak-container">'
      + '<div class="streak-message">' + message + '</div>'
      + '<div class="streak-dots">' + dots + '</div>'
      + '<div class="streak-bar-wrap">'
      + '<div class="streak-bar" style="width:' + percent + '%"></div>'
      + '</div>'
      + rewardPreview
      + '</div>';
  }

  // Build Premium unlock celebration popup
  function buildUnlockPopup() {
    return '<div class="streak-unlock-overlay" id="streak-unlock-popup">'
      + '<div class="streak-unlock-card">'
      + '<div class="streak-unlock-icon">🔓</div>'
      + '<div class="streak-unlock-title">🎉 ยินดีด้วย!</div>'
      + '<div class="streak-unlock-subtitle">คุณเข้า STARVIA ต่อเนื่อง 7 วัน!</div>'
      + '<div class="streak-unlock-reward">'
      + '<div class="streak-unlock-badge">✦ PREMIUM ฟรี 1 วัน ✦</div>'
      + '<div class="streak-unlock-desc">ปลดล็อกดวงชะตาเต็ม · ลาภลอย · หมอทัก · คัมภีร์ 6 ด้าน</div>'
      + '</div>'
      + '<button class="streak-unlock-btn" onclick="StreakReward.claimReward()">🔓 รับรางวัลเลย</button>'
      + '<div class="streak-unlock-note">⏰ ใช้ได้ 24 ชม. หลังจากกดรับ</div>'
      + '</div></div>';
  }

  // Build discount offer banner (after Premium expired)
  function buildDiscountBanner() {
    if (isDiscountOffered()) return '';
    return '<div class="streak-discount-banner">'
      + '<div class="streak-discount-close" onclick="StreakReward.dismissDiscount()">✕</div>'
      + '<div class="streak-discount-icon">⏰</div>'
      + '<div class="streak-discount-text">'
      + '<div class="streak-discount-title">Premium ฟรีหมดอายุแล้ว</div>'
      + '<div class="streak-discount-offer">ส่วนลด 20% เฉพาะคุณ — <strong>159 บาท/เดือน</strong> <span style="opacity:.6;text-decoration:line-through">199</span></div>'
      + '<div class="streak-discount-timer">⏰ หมดอายุใน 48 ชม.</div>'
      + '</div>'
      + '<button class="streak-discount-btn" onclick="StreakReward.claimDiscount()">สมัครเลย</button>'
      + '</div>';
  }

  // Claim the Premium reward via API
  async function claimReward() {
    var btn = document.querySelector('.streak-unlock-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ กำลังปลดล็อก...';
    }
    
    try {
      var API_BASE = (window.STARVIA_CONFIG && window.STARVIA_CONFIG.apiBaseUrl) || window.location.origin;
      var res = await fetch(API_BASE + '/v1/streak/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      var data = await res.json();
      
      if (data.success && data.code) {
        // Show code in popup
        showRewardCode(data.code, data.expiresAt);
      } else {
        // Show error
        alert(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔓 รับรางวัลเลย';
        }
      }
    } catch (err) {
      // Fallback: local unlock
      unlockPremium();
      closePopup();
      try { localStorage.setItem('starvia_premium', 'true'); } catch(e) {}
      window.location.reload();
    }
  }

  // Show reward code after claiming
  function showRewardCode(code, expiresAt) {
    var card = document.querySelector('.streak-unlock-card');
    if (!card) return;
    
    var expiresStr = '';
    if (expiresAt) {
      var d = new Date(expiresAt);
      expiresStr = '⏰ หมดอายุ: ' + d.toLocaleString('th-TH', { 
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
      });
    }
    
    card.innerHTML = '<div class="streak-unlock-icon">🎉</div>'
      + '<div class="streak-unlock-title">ปลดล็อกสำเร็จ!</div>'
      + '<div class="streak-unlock-subtitle">รหัส Premium ฟรี 24 ชม.</div>'
      + '<div class="streak-code-box">'
      + '<div class="streak-code-label">รหัสของคุณ</div>'
      + '<div class="streak-code-value" id="streak-code-display">' + code + '</div>'
      + '<button class="streak-code-copy" onclick="StreakReward.copyCode(\'' + code + '\')">📋 คัดลอก</button>'
      + '</div>'
      + '<div class="streak-code-expires">' + expiresStr + '</div>'
      + '<button class="streak-unlock-btn" onclick="StreakReward.activateCode(\'' + code + '\')">🔓 ใช้รหัสเลย</button>'
      + '<div class="streak-unlock-note">💡 กรอกรหัสในหน้า Premium เพื่อปลดล็อก</div>';
  }

  // Copy code to clipboard
  function copyCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function() {
        var btn = document.querySelector('.streak-code-copy');
        if (btn) {
          btn.textContent = '✅ คัดลอกแล้ว!';
          setTimeout(function() { btn.textContent = '📋 คัดลอก'; }, 2000);
        }
      });
    }
  }

  // Activate code via verify endpoint
  async function activateCode(code) {
    try {
      var API_BASE = (window.STARVIA_CONFIG && window.STARVIA_CONFIG.apiBaseUrl) || window.location.origin;
      var res = await fetch(API_BASE + '/v1/streak/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      var data = await res.json();
      
      if (data.success) {
        unlockPremium();
        closePopup();
        try { localStorage.setItem('starvia_premium', 'true'); } catch(e) {}
        window.location.reload();
      } else {
        alert(data.message || 'รหัสไม่ถูกต้อง');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  // Close popup helper
  function closePopup() {
    var popup = document.getElementById('streak-unlock-popup');
    if (popup) popup.remove();
  }

  // Claim the discount
  function claimDiscount() {
    markDiscountOffered();
    // Redirect to payment or show payment modal
    // For now, just mark as premium with discount
    try {
      localStorage.setItem('starvia_premium', 'true');
      localStorage.setItem('starvia_premium_source', 'streak_discount');
    } catch(e) {}
    window.location.reload();
  }

  // Dismiss the discount banner
  function dismissDiscount() {
    markDiscountOffered();
    var banner = document.querySelector('.streak-discount-banner');
    if (banner) banner.remove();
  }

  // Initialize streak system
  function init() {
    var streak = updateStreak();

    // Check if we need to show the unlock popup
    if (streak.count >= 7 && !isPremiumUnlocked() && !isPremiumExpired()) {
      // Show unlock popup after a short delay
      setTimeout(function() {
        var existing = document.getElementById('streak-unlock-popup');
        if (existing) return;
        var div = document.createElement('div');
        div.innerHTML = buildUnlockPopup();
        document.body.appendChild(div.firstElementChild);
      }, 1500);
    }

    // Check if Premium expired — show discount
    if (streak.count >= 7 && isPremiumExpired() && !isDiscountOffered()) {
      setTimeout(function() {
        var container = document.querySelector('.streak-discount-anchor');
        if (container) {
          container.innerHTML = buildDiscountBanner();
        }
      }, 800);
    }

    // Inject progress bar into report. The render section may not exist
    // yet when DOMContentLoaded fires (renderer-individual.js runs after
    // us in script load order), so try once now and watch the DOM for the
    // anchor to appear so we inject as soon as it does.
    function injectProgress(streak) {
      var anchor = document.querySelector('.streak-progress-anchor');
      if (anchor && streak.count >= 1 && streak.count < 7
          && !anchor.querySelector('.streak-container')) {
        anchor.innerHTML = buildStreakProgress(streak);
        return true;
      }
      return false;
    }
    function injectDiscount() {
      var current = updateStreak();
      // Day 1–6 users must not see the "Premium expired" banner — they
      // never earned the reward in the first place. (Belt-and-braces
      // guard alongside isPremiumExpired().)
      if (current.count < 7) return;
      var container = document.querySelector('.streak-discount-anchor');
      if (container && !container.querySelector('.streak-discount-banner')) {
        var html = buildDiscountBanner();
        if (html) container.innerHTML = html;
      }
    }

    if (!injectProgress(streak)) {
      // Watch for late-rendered anchors (race with renderer-individual.js).
      if (typeof MutationObserver !== 'undefined' && document.body) {
        var obs = new MutationObserver(function() {
          var now = updateStreak();
          if (injectProgress(now)) obs.disconnect();
          injectDiscount();
        });
        obs.observe(document.body, { childList: true, subtree: true });
        // Stop watching after 10s to avoid leaking the observer.
        setTimeout(function() { try { obs.disconnect(); } catch (e) {} }, 10000);
      } else {
        // Fallback: poll
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (injectProgress(streak) || attempts > 20) clearInterval(poll);
        }, 300);
      }
    }
    injectDiscount();
  }

  // Public API. `getStreak` is the most-called entrypoint — route it through
  // updateStreak() so it always reflects the Onboarding journey day (the
  // legacy helper below only reads the now-stale consecutive counter).
  window.StreakReward = {
    init: init,
    getStreak: updateStreak,
    isPremiumUnlocked: isPremiumUnlocked,
    isPremiumExpired: isPremiumExpired,
    claimReward: claimReward,
    claimDiscount: claimDiscount,
    dismissDiscount: dismissDiscount,
    getPremiumTimeRemaining: getPremiumTimeRemaining,
    buildStreakProgress: buildStreakProgress,
    copyCode: copyCode,
    activateCode: activateCode
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
