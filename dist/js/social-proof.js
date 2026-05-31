// ===== SOCIAL PROOF ENGINE =====
// Authority badges, animated counters, rotating testimonials
// Based on: "Barnum Effect works best when the fortune teller has credibility"

(function() {
  'use strict';

  // ===== Testimonial Pool =====
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

  // ===== Animated Counter =====
  function animateCounter(el, target, duration) {
    if (!el) return;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
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

  // ===== Intersection Observer for Counter Animation =====
  function setupCounterAnimation() {
    var counterEl = document.getElementById('sp-total-count');
    if (!counterEl) return;

    var animated = false;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounter(counterEl, 12847, 2000);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(counterEl.parentElement);
  }

  // ===== Rotating Testimonials =====
  function setupTestimonialRotation() {
    var container = document.getElementById('testimonials-container');
    if (!container) return;

    var currentIdx = 0;

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
      if (card) {
        card.classList.add('testimonial-exit');
      }
      setTimeout(function() {
        currentIdx++;
        renderTestimonial(currentIdx);
      }, 500);
    }

    renderTestimonial(0);
    setInterval(rotateTestimonial, 6000);
  }

  // ===== Authority Badge =====
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

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== Newsletter Teaser (Information Gap) =====
  function renderNewsletterTeaser() {
    var teaserText = document.getElementById('newsletter-teaser-text');
    if (!teaserText) return;

    var PF = window.PersonalizedFortune;
    if (PF) {
      var birthData = PF.getBirthData();
      var fortune = PF.buildPersonalizedFortune(birthData);
      // Show just the beginning of the fortune — creates Information Gap
      var text = fortune.quote;
      if (text.length > 80) {
        text = text.substring(0, 77) + '...';
      }
      teaserText.textContent = '"' + text + '"';
    } else {
      teaserText.textContent = '"วันนี้ดาวเจ้าชะตาโคจรผ่านจุดสำคัญ — มีบางอย่างที่คุณควรรู้ก่อนออกจากบ้าน..."';
    }
  }

  // ===== Init =====
  function init() {
    renderAuthorityBadge();
    setupCounterAnimation();
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
  };
})();
