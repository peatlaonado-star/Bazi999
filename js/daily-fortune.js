// ===== DAILY FORTUNE ENGINE =====
// แสดงดวงประจำวันที่เปลี่ยนตามวันในสัปดาห์
// Variable Reward → Hook Model → กระตุ้นให้กลับมาดูใหม่ทุกวัน
// Streak Counter → Gamification → Daily check-in reward

(function() {
  'use strict';

  // ---- Daily Fortune Data (7 วัน) ----
  var fortunes = [
    { // อาทิตย์ (Sun)
      quote: "วันนี้เป็นวันแห่งการเริ่มต้น — พลังงานรอบตัวเปิดรับสิ่งใหม่ เชื่อมั่นในตัวเองให้มากกว่าปกติ",
      element: "ไฟ",
      focus: "เริ่มโปรเจกต์ใหม่, ตัดสินใจเรื่องที่ค้างไว้นาน",
      warning: "อย่ารีบร้อนเกินไป — ใช้ความมั่นใจ อย่าใช้ความหุนหัน"
    },
    { // จันทร์ (Mon)
      quote: "วันจันทร์ ดวงจันทร์นำพาความอ่อนโยนมาให้ — วันนี้ใจเย็น ๆ รับฟังคนรอบข้างให้มากขึ้น",
      element: "น้ำ",
      focus: "สร้างความสัมพันธ์, รับฟัง, แสดงความรัก",
      warning: "อารมณ์อาจขึ้นลงง่าย — อย่าตัดสินใจด้วยอารมณ์ชั่ววูบ"
    },
    { // อังคาร (Tue)
      quote: "พลังวันอังคารเต็มไปด้วยความมุ่งมั่น — วันที่เหมาะกับการลุยงานที่ท้าทายและต้องใช้ความกล้า",
      element: "ไฟ",
      focus: "งานที่ต้องใช้พลัง, แก้ปัญหาเฉพาะหน้า, ออกกำลังกาย",
      warning: "ระวังคำพูดที่แรงเกินไป — ความซื่อตรงไม่ใช่ข้ออ้างของความหยาบคาย"
    },
    { // พุธ (Wed)
      quote: "วันพุธเป็นวันแห่งการสื่อสาร — เหมาะกับการเจรจา นัดหมาย หรือเริ่มบทสนทนาที่สำคัญ",
      element: "ลม",
      focus: "สื่อสาร, เจรจาธุรกิจ, เขียนและวางแผน",
      warning: "ข้อมูลอาจล้น — เลือกรับฟังเฉพาะที่จำเป็น อย่าพยายามทำทุกอย่าง"
    },
    { // พฤหัสบดี (Thu)
      quote: "ดาวพฤหัสเสริมปัญญาและการเติบโต — วันนี้เหมาะกับการเรียนรู้สิ่งใหม่หรือขอคำปรึกษาจากผู้ใหญ่",
      element: "ดิน",
      focus: "เรียนรู้, ขอคำแนะนำ, วางแผนระยะยาว",
      warning: "อย่ามองข้ามรายละเอียดเล็ก ๆ — ความสำเร็จอยู่ในเรื่องที่คุณคิดว่าไม่สำคัญ"
    },
    { // ศุกร์ (Fri)
      quote: "วันศุกร์คือวันแห่งความรักและความสุข — ใช้เวลากับคนที่คุณรัก หรือทำสิ่งที่ทำให้ใจฟู",
      element: "น้ำ",
      focus: "ความรัก, ศิลปะ, สังสรรค์, พักผ่อน",
      warning: "อย่าใช้จ่ายเกินตัวเพื่อความสุขชั่วคราว — ความสุขแท้ไม่ต้องใช้เงินซื้อ"
    },
    { // เสาร์ (Sat)
      quote: "วันเสาร์คือวันแห่งการพักผ่อนและทบทวน — ช้าลงสักนิด มองย้อนดูสิ่งที่ผ่านมาในสัปดาห์นี้",
      element: "ดิน",
      focus: "พักผ่อน, ทบทวน, จัดการเรื่องค้าง, ใช้เวลากับครอบครัว",
      warning: "อย่ากังวลกับสิ่งที่ยังมาไม่ถึง — กังวลวันนี้ไม่ได้ช่วยแก้ปัญหาพรุ่งนี้"
    }
  ];

  // ---- Streak System ----
  var STREAK_KEY = 'starvia_streak';

  function getStreakData() {
    try {
      var raw = localStorage.getItem(STREAK_KEY);
      if (!raw) return { count: 0, lastDate: null };
      return JSON.parse(raw);
    } catch (e) {
      return { count: 0, lastDate: null };
    }
  }

  function saveStreakData(data) {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function getTodayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function updateStreak() {
    var data = getStreakData();
    var today = getTodayKey();

    if (data.lastDate === today) {
      // Already checked in today — no change
      return data;
    }

    // Check if consecutive day
    if (data.lastDate) {
      var lastDate = new Date(data.lastDate + 'T00:00:00');
      var todayDate = new Date(today + 'T00:00:00');
      var diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive — increment
        data.count += 1;
      } else {
        // Missed a day — reset
        data.count = 1;
      }
    } else {
      // First check-in
      data.count = 1;
    }

    data.lastDate = today;
    saveStreakData(data);
    return data;
  }

  function getStreakBadge(count) {
    if (count >= 30) return { emoji: '👑', label: 'ราชาแห่งดวงดาว' };
    if (count >= 14) return { emoji: '🌟', label: 'นักอ่านดวงระดับเซียน' };
    if (count >= 7)  return { emoji: '⭐', label: 'พลังดวงแข็งแกร่ง' };
    if (count >= 3)  return { emoji: '🔥', label: 'ติดตามดวงต่อเนื่อง' };
    return { emoji: '🌱', label: 'เริ่มต้นเดินทาง' };
  }

  function renderStreak() {
    var streakData = updateStreak();
    var badge = getStreakBadge(streakData.count);

    var streakEl = document.getElementById('df-streak');
    if (streakEl) {
      streakEl.innerHTML = '<span class="df-streak-emoji">' + badge.emoji + '</span>' +
        '<span class="df-streak-count">' + streakData.count + ' วัน</span>';
      streakEl.title = badge.label;
    }

    // Update footer text
    var footerEl = document.getElementById('df-footer-msg');
    if (footerEl) {
      if (streakData.count === 1) {
        footerEl.textContent = '🎉 ยินดีด้วย! นี่คือวันแรกของการเดินทาง ✨ กลับมาพรุ่งนี้เพื่อไม่ให้สตรีคขาดนะ';
      } else if (streakData.count === 7) {
        footerEl.textContent = '⭐ ครบ 7 วันแล้ว! พลังดวงของคุณแข็งแกร่งขึ้นทุกวัน — อย่าหยุดนะ ✨';
      } else if (streakData.count === 30) {
        footerEl.textContent = '👑 ครบ 30 วัน! คุณคือผู้พิชิตดวงดาว — STARVIA ภูมิใจในตัวคุณ ✨';
      } else {
        footerEl.textContent = 'อัปเดตทุกวัน — กลับมาเช็กใหม่พรุ่งนี้เพื่อรักษาสตรีค ' + badge.emoji + ' ✨';
      }
    }
  }

  // ---- Render Daily Fortune ----
  function renderDailyFortune() {
    var today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    var f = fortunes[today];

    // Date display
    var dfDate = document.getElementById('df-date');
    if (dfDate) {
      var monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      var d = new Date();
      dfDate.textContent = d.getDate() + ' ' + monthNames[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    }

    // Quote
    var dfQuote = document.getElementById('df-quote');
    if (dfQuote) dfQuote.textContent = '"' + f.quote + '"';

    // Element
    var dfElement = document.getElementById('df-element');
    if (dfElement) dfElement.textContent = f.element;

    // Focus
    var dfFocus = document.getElementById('df-focus');
    if (dfFocus) dfFocus.textContent = f.focus;

    // Warning
    var dfWarning = document.getElementById('df-warning');
    if (dfWarning) dfWarning.textContent = f.warning;
  }

  // ---- Live Counter (Social Proof) ----
  function startLiveCounter() {
    var counterEl = document.getElementById('sp-live-count');
    if (!counterEl) return;

    function updateCounter() {
      var count = Math.floor(Math.random() * 13) + 3;
      counterEl.textContent = count + ' คน';
    }

    updateCounter();
    setInterval(updateCounter, 45000);
  }

  // ---- Init ----
  function init() {
    renderDailyFortune();
    renderStreak();
    startLiveCounter();
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
