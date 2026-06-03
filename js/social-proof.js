// ===== SOCIAL PROOF ENGINE v2 =====
// Dynamic numbers, animated counters, rotating testimonials
// Numbers use Base + Time + Random for natural-looking growth

(function() {
  'use strict';

  // ===== NUMBER CONFIG =====
  // These bases are committed; numbers grow naturally over time
  var CONFIG = {
    totalBase: 12847,        // Base total readings
    totalDailyGrowth: 38,    // Average new readings per day
    todayBase: 280,          // Base for "today" count
    todayVariance: 120,      // Random range for today
    hourBase: 15,            // Base for "this hour"
    hourVariance: 20,        // Random range for this hour
    reviewsBase: 2194,       // Base review count
    reviewsWeeklyGrowth: 6,  // New reviews per week
    satisfaction: 96.7,      // Fixed satisfaction %
    rating: 4.8,             // Fixed star rating
    launchDate: '2025-11-15' // Starvia launch date (for day calculation)
  };

  // ===== SEEDED RANDOM (deterministic per day/hour) =====
  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function daysSinceLaunch() {
    var launch = new Date(CONFIG.launchDate);
    var now = new Date();
    return Math.floor((now - launch) / (1000 * 60 * 60 * 24));
  }

  // ===== DYNAMIC NUMBER GENERATORS =====
  function getTotalReadings() {
    var days = daysSinceLaunch();
    var daySeed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    var randomOffset = Math.floor(seededRandom(daySeed) * 100) - 50; // ±50
    return CONFIG.totalBase + (days * CONFIG.totalDailyGrowth) + randomOffset;
  }

  function getTodayCount() {
    var hour = new Date().getHours();
    var daySeed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    // More activity during daytime (8-22), less at night
    var hourMultiplier = (hour >= 8 && hour <= 22) ? 1.0 : 0.3;
    var base = Math.floor(CONFIG.todayBase * hourMultiplier);
    var random = Math.floor(seededRandom(daySeed + hour) * CONFIG.todayVariance);
    return base + random;
  }

  function getThisHourCount() {
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
    return CONFIG.hourBase + Math.floor(seededRandom(seed) * CONFIG.hourVariance);
  }

  function getReviewCount() {
    var weeks = Math.floor(daysSinceLaunch() / 7);
    var daySeed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    var randomOffset = Math.floor(seededRandom(daySeed + 99) * 20) - 10;
    return CONFIG.reviewsBase + (weeks * CONFIG.reviewsWeeklyGrowth) + randomOffset;
  }

  function getLiveCount() {
    // Simulated live viewers: 3-12
    var now = new Date();
    var seed = now.getMinutes() + now.getHours() * 60;
    return 3 + Math.floor(seededRandom(seed) * 10);
  }

  // ===== ANIMATED COUNTER =====
  function animateCounter(el, target, duration) {
    if (!el) return;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + '+';
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + '+';
      }
    }
    requestAnimationFrame(step);
  }

  // ===== RENDER STATS =====
  function renderStats() {
    // Total readings
    var totalEl = document.getElementById('sp-total-count');
    if (totalEl) {
      var total = getTotalReadings();
      // Set initial, then animate
      totalEl.textContent = '0';
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateCounter(totalEl, total, 2000);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(totalEl.parentElement);
    }

    // Live count (กำลังอ่านอยู่)
    var liveEl = document.getElementById('sp-live-count');
    if (liveEl) {
      var live = getLiveCount();
      liveEl.innerHTML = '<span class="live-number">' + live + '</span>';
      // Refresh every 30-60 seconds
      setInterval(function() {
        var newLive = getLiveCount();
        var numEl = liveEl.querySelector('.live-number');
        if (numEl) numEl.textContent = newLive;
      }, 30000 + Math.random() * 30000);
    }

    // Today count
    var todayEl = document.getElementById('sp-today-count');
    if (todayEl) {
      todayEl.textContent = getTodayCount().toLocaleString();
    }

    // This hour
    var hourEl = document.getElementById('sp-hour-count');
    if (hourEl) {
      hourEl.textContent = getThisHourCount();
    }

    // Satisfaction
    var satEl = document.getElementById('sp-satisfaction');
    if (satEl) {
      satEl.textContent = CONFIG.satisfaction + '%';
    }

    // Rating
    var ratingEl = document.getElementById('sp-rating');
    if (ratingEl) {
      ratingEl.textContent = CONFIG.rating + ' ★';
    }

    // Reviews
    var reviewEl = document.getElementById('sp-review-count');
    if (reviewEl) {
      reviewEl.textContent = getReviewCount().toLocaleString();
    }
  }

  // ===== TESTIMONIALS =====
  var TESTIMONIALS = [
    { text: 'อ่านแล้วขนลุกเลยค่ะ ตรงมากกก ไม่คิดว่าแค่วันเกิดจะบอกอะไรได้ขนาดนี้', author: 'หนึ่งฤทัย', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'ส่งให้แฟนดู แฟนตกใจเลย บอกว่าเหมือนรู้จักเราจริงๆ 555', author: 'พลอย', loc: 'เชียงใหม่', stars: 5 },
    { text: 'ดูทุกเช้าเลยค่ะ เลขนำโชคให้มาตรงกับที่ซื้อหวยบ่อยมาก', author: 'สมศรี', loc: 'นครราชสีมา', stars: 5 },
    { text: 'รายงานตัวตนอ่านแล้วเข้าใจตัวเองมากขึ้น เหมือนมีคนมาอธิบายสิ่งที่รู้สึกอยู่ข้างใน', author: 'กมล', loc: 'ชลบุรี', stars: 5 },
    { text: 'ชอบตรงที่ไม่ใช่แค่ดูดวง แต่แนะนำวิธีแก้ไขด้วย ไม่ใช่แค่บอกว่าดีหรือไม่ดี', author: 'ปิยะ', loc: 'ภูเก็ต', stars: 5 },
    { text: 'ดูดวงคู่กับแฟนแล้วเข้าใจกันมากขึ้นจริงๆ ค่ะ แฟนก็ชอบ', author: 'นภา', loc: 'ขอนแก่น', stars: 5 },
    { text: 'สีมงคลให้มา ลองใส่เสื้อสีนั้น วันนั้นงานราบรื่นจริงๆ นะ', author: 'วิชัย', loc: 'สงขลา', stars: 5 },
    { text: 'เพื่อนส่งลิงก์มาให้ ตอนแรกไม่เชื่อ พออ่านจบก็ส่งต่อให้คนอื่นอีก 5 คนเลย', author: 'จิราภรณ์', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'เปิดดูทุกเช้าก่อนออกจากบ้าน เหมือนเช็คดวงประจำวันเลยค่ะ', author: 'สุดา', loc: 'พิษณุโลก', stars: 5 },
    { text: 'ไพ่ประจำวันแม่นมาก วันที่ได้ไพ่ "ดวงอาทิตย์" วันนั้นโชคดีจริงๆ', author: 'อรุณ', loc: 'ระยอง', stars: 5 },
  ];

  function setupTestimonialRotation() {
    var container = document.getElementById('testimonials-container');
    if (!container) return;

    var currentIdx = Math.floor(Math.random() * TESTIMONIALS.length); // Start random

    function renderTestimonial(idx) {
      var t = TESTIMONIALS[idx % TESTIMONIALS.length];
      var stars = '';
      for (var i = 0; i < t.stars; i++) stars += '★';

      container.innerHTML = '<div class="testimonial-card testimonial-enter">'
        + '<div class="testimonial-stars">' + stars + '</div>'
        + '<p class="testimonial-text">"' + escapeHTML(t.text) + '"</p>'
        + '<div class="testimonial-author">— ' + escapeHTML(t.author) + ', ' + escapeHTML(t.loc) + '</div>'
        + '</div>';
    }

    function rotateTestimonial() {
      var card = container.querySelector('.testimonial-card');
      if (card) card.classList.add('testimonial-exit');
      setTimeout(function() {
        currentIdx++;
        renderTestimonial(currentIdx);
      }, 500);
    }

    renderTestimonial(currentIdx);
    setInterval(rotateTestimonial, 10000);
  }

  // ===== AUTHORITY BADGE =====
  function renderAuthorityBadge() {
    var container = document.getElementById('sp-authority');
    if (!container) return;

    container.innerHTML = '<div class="sp-authority-inner">'
      + '<div class="sp-authority-icon">🔭</div>'
      + '<div class="sp-authority-text">'
      + '<div class="sp-authority-title">วิเคราะห์จากโหราศาสตร์ไทยโบราณ</div>'
      + '<div class="sp-authority-detail">นพเคราะห์ · ทักษาปกรณ์ · ราศีจักร · ลัคนา · ตำแหน่งดาว 7 ดวง</div>'
      + '</div>'
      + '</div>';
  }

  // ===== NEWSLETTER TEASER =====
  function renderNewsletterTeaser() {
    var teaserText = document.getElementById('newsletter-teaser-text');
    if (!teaserText) return;

    var PF = window.PersonalizedFortune;
    if (PF) {
      var birthData = PF.getBirthData();
      var fortune = PF.buildPersonalizedFortune(birthData);
      var text = fortune.quote;
      if (text.length > 80) text = text.substring(0, 77) + '...';
      teaserText.textContent = '"' + text + '"';
    } else {
      teaserText.textContent = '"วันนี้ดาวเจ้าชะตาโคจรผ่านจุดสำคัญ — มีบางอย่างที่คุณควรรู้ก่อนออกจากบ้าน..."';
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== INIT =====
  function init() {
    renderAuthorityBadge();
    renderStats();
    setupTestimonialRotation();
    renderNewsletterTeaser();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SocialProof = {
    TESTIMONIALS: TESTIMONIALS,
    animateCounter: animateCounter,
    getTotalReadings: getTotalReadings,
    getTodayCount: getTodayCount,
    getReviewCount: getReviewCount,
    CONFIG: CONFIG
  };
})();
