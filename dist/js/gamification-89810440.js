// ===== STARVIA GAMIFICATION ENGINE =====
// Streak, Badges, and Challenges — ให้ผู้ใช้ "ทิ้งไม่ลง"

var Gamification = (function() {
  'use strict';

  var STORAGE_KEY = 'starvia_gamification';
  function getLS() { return (typeof localStorage !== 'undefined') ? localStorage : (window && window.localStorage); }
  function safeJSON(str) { try { return JSON.parse(str); } catch(e) { return null; } }

  // ===== Badge Definitions =====
  var BADGES = [
    { id: 'first-light', name: 'แสงเริ่มแรก', icon: '🌟', desc: 'เริ่มเดินทางบน STARVIA', requirement: 'start', day: 0 },
    { id: 'day-3', name: 'นักดูดวงมือใหม่', icon: '🔮', desc: 'ดูดวง 3 วันติด', requirement: 'streak', day: 3 },
    { id: 'day-7', name: 'สายมูตัวจริง', icon: '✨', desc: 'ดูดวง 7 วันติด', requirement: 'streak', day: 7 },
    { id: 'day-14', name: 'หมอดูประจำตัว', icon: '🌙', desc: 'ดูดวง 14 วันติด', requirement: 'streak', day: 14 },
    { id: 'day-30', name: 'จอมเวทย์แห่งดวงดาว', icon: '👑', desc: 'ดูดวง 30 วันติด', requirement: 'streak', day: 30 },
    { id: 'couple-reader', name: 'คู่รักนักดูดวง', icon: '💕', desc: 'ดูดวงคู่ครั้งแรก', requirement: 'couple', day: 0 },
    { id: 'deep-reader', name: 'นักวิเคราะห์ลึก', icon: '🔍', desc: 'ปลดล็อก Premium ครั้งแรก', requirement: 'premium', day: 0 },
  ];

  // ===== Challenge Definitions =====
  var CHALLENGES = [
    { id: 'daily-visit', name: 'เข้าชมวันนี้', desc: 'เปิด STARVIA วันนี้', icon: '📅', points: 10 },
    { id: 'read-full', name: 'อ่านครบจบ', desc: 'เลื่อนลงไปอ่านผลทำนายจนจบ', icon: '📖', points: 20 },
    { id: 'share-result', name: 'แชร์ผลทำนาย', desc: 'กดแชร์ผลทำนายของคุณ', icon: '📤', points: 15 },
    { id: 'try-couple', name: 'ลองดูดวงคู่', desc: 'ดูดวงคู่กับคนที่คุณรัก', icon: '💕', points: 25 },
    { id: 'comeback', name: 'กลับมาอีกครั้ง', desc: 'กลับมาดูดวงหลังหายไป 1 วัน', icon: '🔄', points: 30 },
  ];

  // ===== State =====
  function getState() {
    var raw = getLS().getItem(STORAGE_KEY);
    var data = safeJSON(raw);
    if (!data) {
      return {
        badges: [],
        points: 0,
        completedChallenges: [],
        lastVisit: null,
        totalVisits: 0,
        coupleRead: false,
        premiumUnlocked: false,
      };
    }
    return {
      badges: data.badges || [],
      points: data.points || 0,
      completedChallenges: data.completedChallenges || [],
      lastVisit: data.lastVisit || null,
      totalVisits: data.totalVisits || 0,
      coupleRead: data.coupleRead || false,
      premiumUnlocked: data.premiumUnlocked || false,
    };
  }

  function saveState(state) {
    getLS().setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ===== Core Functions =====

  function recordVisit() {
    var state = getState();
    var today = new Date().toISOString().slice(0, 10);
    var isNew = state.lastVisit !== today;
    if (isNew) {
      state.totalVisits++;
      state.lastVisit = today;
      saveState(state);
    }
    return isNew;
  }

  function getStreak() {
    // Single source of truth: StreakReward (uses Onboarding journey day)
    // This guarantees the trophy counter matches the "ดูดวงมา X/7 วัน" progress
    // bar shown by streak-tracker.js. Falling back to the legacy local counter
    // only when StreakReward is unavailable (older test harnesses).
    if (typeof window !== 'undefined' && window.StreakReward
        && typeof window.StreakReward.getStreak === 'function') {
      try {
        var s = window.StreakReward.getStreak();
        return s && typeof s.count === 'number' ? s.count : 0;
      } catch (e) { /* fall through to legacy */ }
    }

    // Legacy fallback (approximate). The previous version of this loop
    // blindly incremented streak 30 times regardless of actual visit log,
    // which caused the trophy to drift behind the streak-tracker progress
    // bar (e.g. 5 days vs 6 days). We now trust the legacy visit counter
    // and only count a streak as long as the last visit was within 2 days.
    var state = getState();
    if (!state.lastVisit) return 0;
    var today = new Date();
    var last = new Date(state.lastVisit);
    var diff = Math.floor((today - last) / 86400000);
    if (diff > 1) return 0; // streak broken
    return Math.min(state.totalVisits, 30);
  }

  function checkBadges(streak) {
    var state = getState();
    var newBadges = [];
    BADGES.forEach(function(badge) {
      if (state.badges.indexOf(badge.id) !== -1) return; // already have it
      var earned = false;
      if (badge.requirement === 'start' && state.totalVisits >= 1) earned = true;
      if (badge.requirement === 'streak' && streak >= badge.day) earned = true;
      if (badge.requirement === 'couple' && state.coupleRead) earned = true;
      if (badge.requirement === 'premium' && state.premiumUnlocked) earned = true;
      if (earned) {
        state.badges.push(badge.id);
        state.points += 50;
        newBadges.push(badge);
      }
    });
    if (newBadges.length > 0) saveState(state);
    return newBadges;
  }

  function addPoints(pts) {
    var state = getState();
    state.points += pts;
    saveState(state);
    return state.points;
  }

  function completeChallenge(challengeId) {
    var state = getState();
    if (state.completedChallenges.indexOf(challengeId) !== -1) return false;
    var challenge = CHALLENGES.find(function(c) { return c.id === challengeId; });
    if (!challenge) return false;
    state.completedChallenges.push(challengeId);
    state.points += challenge.points;
    saveState(state);
    return true;
  }

  function markCoupleRead() {
    var state = getState();
    if (!state.coupleRead) {
      state.coupleRead = true;
      saveState(state);
    }
  }

  function markPremiumUnlocked() {
    var state = getState();
    if (!state.premiumUnlocked) {
      state.premiumUnlocked = true;
      saveState(state);
    }
  }

  function getCompletedCount() {
    return getState().completedChallenges.length;
  }

  function getTotalChallenges() {
    return CHALLENGES.length;
  }

  function reset() {
    getLS().removeItem(STORAGE_KEY);
  }

  // ===== Rendering =====

  function renderStreakBadge(streak) {
    if (streak < 1) return '';
    var level, color, label;
    if (streak >= 30) { level = 'master'; color = '#c9a227'; label = '👑 Master'; }
    else if (streak >= 14) { level = 'expert'; color = '#9B8AB8'; label = '🌙 Expert'; }
    else if (streak >= 7) { level = 'dedicated'; color = '#E8A0CF'; label = '✨ Dedicated'; }
    else if (streak >= 3) { level = 'rising'; color = '#6EC89A'; label = '🔮 Rising'; }
    else { level = 'newbie'; color = '#a09880'; label = '🌟 New'; }

    return '<div class="gk-streak" style="border-color:' + color + '">'
      + '<div class="gk-streak-fire">' + (streak >= 7 ? '🔥' : streak >= 3 ? '🔥' : '✦') + '</div>'
      + '<div class="gk-streak-info">'
      + '<div class="gk-streak-num" style="color:' + color + '">' + streak + ' วัน</div>'
      + '<div class="gk-streak-label">' + label + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderBadges(badges) {
    if (badges.length === 0) return '';
    var html = '<div class="gk-badges">';
    BADGES.forEach(function(badge) {
      var earned = badges.indexOf(badge.id) !== -1;
      html += '<div class="gk-badge ' + (earned ? 'gk-badge-earned' : 'gk-badge-locked') + '" title="' + badge.desc + '">'
        + '<span class="gk-badge-icon">' + (earned ? badge.icon : '🔒') + '</span>'
        + '<span class="gk-badge-name">' + badge.name + '</span>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderProgressBar(points) {
    var levels = [0, 50, 150, 300, 500, 1000];
    var labels = ['เริ่มต้น', 'นักดูดวง', 'สายมู', 'หมอดู', 'ปรมาจารย์', 'ตำนาน'];
    var currentLevel = 0;
    for (var i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i]) { currentLevel = i; break; }
    }
    var nextLevel = Math.min(currentLevel + 1, levels.length - 1);
    var progress = currentLevel >= levels.length - 1 ? 100 : Math.round(((points - levels[currentLevel]) / (levels[nextLevel] - levels[currentLevel])) * 100);

    return '<div class="gk-level">'
      + '<div class="gk-level-header">'
      + '<span class="gk-level-name">' + labels[currentLevel] + '</span>'
      + '<span class="gk-level-points">' + points + ' pts</span>'
      + '</div>'
      + '<div class="gk-level-bar">'
      + '<div class="gk-level-fill" style="width:' + progress + '%"></div>'
      + '</div>'
      + (currentLevel < levels.length - 1
        ? '<div class="gk-level-next">ถัดไป: ' + labels[nextLevel] + ' (' + levels[nextLevel] + ' pts)</div>'
        : '<div class="gk-level-next">🏆 ระดับสูงสุดแล้ว!</div>')
      + '</div>';
  }

  function renderChallenges() {
    var state = getState();
    var html = '<div class="gk-challenges">';
    html += '<div class="gk-challenges-title">🎯 ภารกิจวันนี้</div>';
    CHALLENGES.forEach(function(c) {
      var done = state.completedChallenges.indexOf(c.id) !== -1;
      html += '<div class="gk-challenge ' + (done ? 'gk-challenge-done' : '') + '">'
        + '<span class="gk-challenge-icon">' + c.icon + '</span>'
        + '<span class="gk-challenge-info">'
        + '<span class="gk-challenge-name">' + c.name + '</span>'
        + '<span class="gk-challenge-desc">' + c.desc + '</span>'
        + '</span>'
        + '<span class="gk-challenge-pts">+' + c.points + ' pts</span>'
        + (done ? '<span class="gk-challenge-check">✓</span>' : '')
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderNewBadgeNotification(badge) {
    return '<div class="gk-notification gk-notif-celebrate" id="gk-badge-notification">'
      + '<div class="gk-notif-sparkle"></div>'
      + '<div class="gk-notif-content">'
      + '<span class="gk-notif-icon">' + badge.icon + '</span>'
      + '<div class="gk-notif-text">'
      + '<div class="gk-notif-title">🎉 ได้รับ badge ใหม่!</div>'
      + '<div class="gk-notif-name">' + badge.name + '</div>'
      + '<div class="gk-notif-desc">' + badge.desc + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderMilestoneToast(streak) {
    var milestones = {
      3:  { emoji: '🔮', title: '3 วันแรกสำเร็จ!', sub: 'คุณเริ่มเดินทางบนเส้นทางดวงดาวแล้ว', color: '#6EC89A' },
      7:  { emoji: '✨', title: 'ครบ 7 วัน!', sub: 'พลังดวงของคุณแข็งแกร่งขึ้นเรื่อยๆ', color: '#E8A0CF' },
      14: { emoji: '🌙', title: '14 วัน!', sub: 'คุณคือนักดูดวงตัวจริงแล้ว', color: '#9B8AB8' },
      30: { emoji: '👑', title: '30 วัน!', sub: 'จอมเวทย์แห่งดวงดาว — คุณพิชิต STARVIA แล้ว!', color: '#c9a227' },
    };
    var m = milestones[streak];
    if (!m) return '';
    return '<div class="gk-notification gk-notif-milestone" id="gk-milestone-toast" style="border-color:' + m.color + '40">'
      + '<div class="gk-notif-sparkle"></div>'
      + '<div class="gk-notif-content">'
      + '<span class="gk-notif-icon">' + m.emoji + '</span>'
      + '<div class="gk-notif-text">'
      + '<div class="gk-notif-title" style="color:' + m.color + '">' + m.title + '</div>'
      + '<div class="gk-notif-name">' + m.sub + '</div>'
      + '<div class="gk-notif-desc">ดูดวงต่อเนื่อง ' + streak + ' วัน! 🔥</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function dismissNotification() {
    var el = document.getElementById('gk-badge-notification');
    if (el) el.remove();
  }

  function dismissMilestone() {
    var el = document.getElementById('gk-milestone-toast');
    if (el) el.remove();
  }

  // ===== Init =====
  function init() {
    var isNewVisit = recordVisit();
    var state = getState();
    var streak = getStreak();
    var newBadges = checkBadges(streak);

    // Show new badge notifications
    if (newBadges.length > 0) {
      newBadges.forEach(function(badge, i) {
        setTimeout(function() {
          document.body.insertAdjacentHTML('beforeend', renderNewBadgeNotification(badge));
          setTimeout(dismissNotification, 4000);
        }, i * 1500);
      });
    }

    // Show milestone celebration toast (day 3, 7, 14, 30)
    var milestoneDays = [3, 7, 14, 30];
    if (milestoneDays.indexOf(streak) !== -1) {
      var mDelay = newBadges.length > 0 ? newBadges.length * 1500 + 1500 : 500;
      setTimeout(function() {
        document.body.insertAdjacentHTML('beforeend', renderMilestoneToast(streak));
        setTimeout(dismissMilestone, 5000);
      }, mDelay);
    }

    // Auto-complete daily-visit challenge
    if (isNewVisit) {
      completeChallenge('daily-visit');
    }

    return { streak: streak, badges: state.badges, points: state.points, isNew: isNewVisit };
  }

  return {
    getState: getState,
    recordVisit: recordVisit,
    getStreak: getStreak,
    checkBadges: checkBadges,
    addPoints: addPoints,
    completeChallenge: completeChallenge,
    markCoupleRead: markCoupleRead,
    markPremiumUnlocked: markPremiumUnlocked,
    getCompletedCount: getCompletedCount,
    getTotalChallenges: getTotalChallenges,
    reset: reset,
    init: init,
    renderStreakBadge: renderStreakBadge,
    renderBadges: renderBadges,
    renderProgressBar: renderProgressBar,
    renderChallenges: renderChallenges,
    renderNewBadgeNotification: renderNewBadgeNotification,
    renderMilestoneToast: renderMilestoneToast,
    dismissNotification: dismissNotification,
    dismissMilestone: dismissMilestone,
    BADGES: BADGES,
    CHALLENGES: CHALLENGES,
  };
})();

if (typeof window !== 'undefined') { window.Gamification = Gamification; }
