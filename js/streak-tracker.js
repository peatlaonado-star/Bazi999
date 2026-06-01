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

  // Update streak on each visit
  function updateStreak() {
    var streak = getStreak();
    var today = todayStr();

    if (streak.lastDate === today) {
      // Already visited today — no change
      return streak;
    }

    var gap = streak.lastDate ? daysBetween(streak.lastDate, today) : 999;

    if (gap === 1) {
      // Consecutive day!
      streak.count += 1;
    } else if (gap > 1) {
      // Streak broken — restart
      streak.count = 1;
      streak.startDate = today;
    }

    streak.lastDate = today;
    if (!streak.startDate) streak.startDate = today;
    saveStreak(streak);
    return streak;
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

  // Check if Premium was unlocked but now expired
  function isPremiumExpired() {
    try {
      var raw = localStorage.getItem(PREMIUM_UNLOCK_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return data.unlocked && data.expiresAt <= Date.now();
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

  // Build streak progress bar HTML
  function buildStreakProgress(streak) {
    var count = streak.count;
    var target = 7;
    var percent = Math.min(100, Math.round((count / target) * 100));
    var remaining = target - count;

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

    return '<div class="streak-container">'
      + '<div class="streak-message">' + message + '</div>'
      + '<div class="streak-dots">' + dots + '</div>'
      + '<div class="streak-bar-wrap">'
      + '<div class="streak-bar" style="width:' + percent + '%"></div>'
      + '</div>'
      + '<div class="streak-reward">🎁 ครบ 7 วัน — ปลดล็อก Premium ฟรี 1 วัน!</div>'
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

  // Claim the Premium reward
  function claimReward() {
    unlockPremium();
    // Close popup
    var popup = document.getElementById('streak-unlock-popup');
    if (popup) popup.remove();
    // Set premium flag for the app to read
    try { localStorage.setItem('starvia_premium', 'true'); } catch(e) {}
    // Reload to show premium content
    window.location.reload();
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
    if (isPremiumExpired() && !isDiscountOffered()) {
      setTimeout(function() {
        var container = document.querySelector('.streak-discount-anchor');
        if (container) {
          container.innerHTML = buildDiscountBanner();
        }
      }, 800);
    }

    // Inject progress bar into report
    setTimeout(function() {
      var anchor = document.querySelector('.streak-progress-anchor');
      if (anchor && streak.count >= 1 && streak.count < 7) {
        anchor.innerHTML = buildStreakProgress(streak);
      }
    }, 600);
  }

  // Public API
  window.StreakReward = {
    init: init,
    getStreak: getStreak,
    isPremiumUnlocked: isPremiumUnlocked,
    isPremiumExpired: isPremiumExpired,
    claimReward: claimReward,
    claimDiscount: claimDiscount,
    dismissDiscount: dismissDiscount,
    getPremiumTimeRemaining: getPremiumTimeRemaining,
    buildStreakProgress: buildStreakProgress
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
