// UI actions extracted from app.js
function saveImage(targetClass, fileName, evt) {
  var target = document.querySelector('.' + targetClass);
  if(!target) return;

  var btn = evt && evt.currentTarget ? evt.currentTarget : null;
  if(!btn) return;
  var originalText = btn.innerHTML;
  btn.innerHTML = '⏳ กำลังสร้างรูปภาพ...';
  btn.style.opacity = '0.7';

  // แอบเปิดลายน้ำ Starvia ตอนกำลังถ่ายรูป
  var wm = target.querySelector('.watermark');
  if(!wm) {
    wm = document.createElement('div');
    wm.className = 'watermark';
    wm.innerHTML = '<div class="wm-brand">STARVIA</div><div class="wm-link">เช็กดวงของคุณได้ที่ www.starvia.app</div>';
    target.appendChild(wm);
  }
  wm.style.display = 'block';

  // ปรับแต่งสีพื้นหลังเล็กน้อยก่อนถ่ายรูป
  target.style.background = 'linear-gradient(180deg, #1A1035, #0d0828)';

  // ถ่ายรูป
  html2canvas(target, { 
    scale: 2, // รูปชัดระดับ HD (Retina)
    backgroundColor: '#0d0828',
    useCORS: true
  }).then(function(canvas) {
    // ซ่อนลายน้ำและคืนสีพื้นหลังเดิมหลังถ่ายเสร็จ
    wm.style.display = 'none';
    target.style.background = '';
    
    // คืนปุ่มเดิม
    btn.innerHTML = originalText;
    btn.style.opacity = '1';

    // ดาวน์โหลดรูปภาพ
    var link = document.createElement('a');
    link.download = fileName + '_Starvia.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(function() {
    btn.innerHTML = '❌ เกิดข้อผิดพลาด';
    setTimeout(function(){ btn.innerHTML = originalText; btn.style.opacity = '1'; }, 2000);
  });
}

// ===== DAILY STAR MANTRA =====
function initDailyMantra() {
  // ข้อความฮีลใจ 7 วัน 7 สไตล์ (เปลี่ยนตามวันในสัปดาห์อัตโนมัติ)
  var mantras = [
    "อนุญาตให้ตัวเองเติบโตในจังหวะของตัวเอง เหมือนพระจันทร์ที่ไม่เคยรีบเร่งเต็มดวง ☽", // อาทิตย์
    "ดวงดาวไม่ได้กำหนดทางเดินให้คุณ แต่ช่วยส่องสว่างให้คุณเห็นทางชัดขึ้น ✦", // จันทร์
    "ความเข้มแข็งที่แท้จริง คือการกล้าโอบกอดความอ่อนแอของตัวเอง 🤍", // อังคาร
    "พายุไม่ได้มาเพื่อทำลายเสมอไป บางครั้งมันมาเพื่อชำระล้างเส้นทางใหม่ 🌧️", // พุธ
    "คุณมีพลังของจักรวาลซ่อนอยู่ในตัว จงเชื่อมั่นในสัญชาตญาณของตัวเอง ✨", // พฤหัสบดี
    "แม้ในคืนที่มืดมิดที่สุด ดาวดวงเล็กๆ ก็ยังสามารถนำทางคุณได้ 🌟", // ศุกร์
    "ทุกการเริ่มต้นใหม่ ต้องการการปล่อยวางจากสิ่งเดิมเสมอ 🍃" // เสาร์
  ];
  
  var today = new Date().getDay(); // หาว่าวันนี้คือวันอะไร (0-6)
  var mantra = mantras[today];
  
  // ถ้าเป็นภาษาอังกฤษ ให้สลับข้อความนิดหน่อย
  if (CL === 'en') {
    mantra = "Allow yourself to grow at your own pace, like the moon that never rushes to be full. ☽";
  }
  
  var html = '<div class="daily-mantra">'
           + '<div class="dm-lbl">✦ Daily Star Mantra ✦</div>'
           + '<div class="dm-txt">"' + mantra + '"</div>'
           + '</div>';
           
  // นำไปแทรกไว้ใต้ Header (ส่วนหัวของเว็บ) ก่อนถึงปุ่มเลือกโหมด
  var hd = document.querySelector('.hd');
  if(hd) {
    hd.insertAdjacentHTML('afterend', html);
  }
}

// เรียกใช้งานฟังก์ชันทันทีที่หน้าเว็บโหลดเสร็จ
initDailyMantra();

// ===== FREEMIUM UNLOCK SYSTEM (ปลดล็อกเนื้อหาบนเว็บ) =====

// ===== PREMIUM STATE ABSTRACTION =====
// ใช้ isPremiumUnlocked() แทนการเช็ค window.isPremiumUnlocked โดยตรง
// เมื่อย้ายไป backend จริง ให้เปลี่ยนแค่ฟังก์ชันนี้
var _premiumState = { unlocked: false, token: null };

function isPremiumUnlocked() {
  return _premiumState.unlocked;
}

function setPremiumUnlocked(unlocked, token) {
  _premiumState.unlocked = !!unlocked;
  _premiumState.token = token || null;
  // sync backward-compat global (DEPRECATED — will be removed after backend migration)
  window.isPremiumUnlocked = _premiumState.unlocked;
}

// DEPRECATED: ใช้ isPremiumUnlocked() แทน — จะลบออกหลังย้าย backend
window.isPremiumUnlocked = false;

// 1. เปิดป๊อปอัปชำระเงิน (เวอร์ชันกระตุ้นยอดขายขั้นสุด)
function openPayment() {
  var overlay = document.getElementById('payment-modal');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'payment-modal';
    overlay.className = 'modal-overlay';
    
    // โครงสร้างหน้าต่างป๊อปอัป
    overlay.innerHTML = '<div class="modal-content" style="position:relative; max-height: 90vh; overflow-y: auto;">'
      + '<button class="modal-close" data-action="close-payment">✕</button>'
      + '<div style="color:#C9A227; font-size:16px; font-weight:700; margin-bottom:5px;">✦ ปลดล็อกคัมภีร์ดวงชะตา ✦</div>'
      + '<div style="color:#e8dfc8; font-size:12px; margin-bottom:15px;">The Complete Life Blueprint</div>'
      
      + '<div class="qr-box" style="margin: 0 auto 10px;"><img src="assets/qr-payment.jpg" style="max-width:100%; max-height:100%; object-fit:contain;" alt="QR Code"></div>'
      
      // 💡 กลยุทธ์ Price Anchoring (ขีดทับราคาเต็ม)
      + '<div style="font-size:28px; font-weight:700; color:#fff; margin-bottom:5px; font-family:\'Georgia\', \'Times New Roman\', serif;">'
      + '<span style="font-size:14px; color:#8B6914; text-decoration:line-through; margin-right:10px;">590 THB</span>199 THB</div>'
      + '<div style="font-size:11px; color:#4CAF50; font-weight:600; margin-bottom:15px;">🔥 ราคาพิเศษเฉพาะช่วง Early Access</div>'
      
      + '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:15px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.08);">'
      + '<div class="step-txt"><strong>ขั้นตอนที่ 1:</strong> สแกนชำระเงิน แล้วกดปุ่มเพื่อส่งสลิปให้แอดมิน</div>'
      + '<a href="https://m.me/61573341702581" target="_blank" class="pdf-btn" style="display:block; text-decoration:none; background:linear-gradient(90deg, #2196F3, #1976D2); color:#fff; font-size:13px; padding:12px; margin-bottom:15px; box-shadow:none; animation:none;">💬 ส่งสลิปทาง Inbox</a>'
      
      + '<div class="step-txt" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:15px;"><strong>ขั้นตอนที่ 2:</strong> นำ "รหัสผ่าน" ที่ได้รับมากรอกที่นี่</div>'
      + '<input type="text" id="pdf-pin" class="pin-input" placeholder="รหัสผ่าน 6 หลัก">'
      + '<button id="confirm-pay-btn" class="pdf-btn" style="width:100%; font-size:14px; padding:12px;" data-action="verify-pin">🔓 ยืนยันรหัสปลดล็อก</button>'
      + '</div>'
      
      + '<div id="pin-error" style="color:#F44336; font-size:12px; display:none; margin-top:-5px; margin-bottom:10px;">❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</div>'
      
      // 💡 กล่องรีวิวปิดการขาย (Social Proof)
      + '<div style="text-align:left; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px; margin-top: 5px;">'
      + '<div style="font-size: 11px; color: #b8a8d8; margin-bottom: 8px; letter-spacing: 0.05em;">💬 เสียงจากผู้ปลดล็อกคัมภีร์:</div>'
      + '<div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 2px solid #C9A227; margin-bottom: 8px;">'
      + '<div style="font-size: 11.5px; color: #e8dfc8; font-style: italic; line-height: 1.5;">"ตอนแรกนึกว่าจะเหมือนแอปดูดวงทั่วไป แต่พออ่านเรื่องหลุมพรางการงานแล้วขนลุกเลยค่ะ เอาไปปรับใช้ได้จริง คุ้มเกินราคามาก"</div>'
      + '<div style="font-size: 9px; color: #7a6a9a; margin-top: 6px; text-align: right;">— คุณ น., Beta Tester</div>'
      + '</div>'
      + '</div>'

      + '</div>';
    document.body.appendChild(overlay);
  }
  
  overlay.style.display = 'flex';
  document.getElementById('pdf-pin').value = ''; 
  document.getElementById('pin-error').style.display = 'none'; 
}

function closePayment() {
  document.getElementById('payment-modal').style.display = 'none';
}

// 2. ระบบตรวจรหัสผ่าน และปลดความเบลอ
// NOTE: โค้ดนี้เป็น DEMO MODE เท่านั้น — ห้ามใช้ใน production
// Production ต้องเรียก backend API แทน
function verifyPin() {
  var pin = document.getElementById('pdf-pin').value.trim().toUpperCase(); 
  var btn = document.getElementById('confirm-pay-btn');
  var err = document.getElementById('pin-error');
  
  // ===== DEMO MODE: โค้ดด้านล่างนี้จะถูกลบเมื่อ backend พร้อม =====
  // TODO: แทนที่ส่วนนี้ด้วย API call
  // POST /api/premium/verify { pin: pin, userId: ... }
  // Response: { success: true, token: 'xxx', expiresIn: 86400 }
  var DEMO_PINS = ['STAR199']; // DEMO ONLY — will be removed
  var isDemoMode = true; // SET TO false WHEN BACKEND IS READY
  
  if (isDemoMode) {
    // Demo: check against local pins
    if (DEMO_PINS.indexOf(pin) !== -1) {
      onPremiumVerified(null);
    } else {
      onPremiumFailed();
    }
    return;
  }
  // ===== END DEMO MODE =====
  
  // Production: call backend
  // fetch('/api/premium/verify', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ pin: pin })
  // })
  // .then(function(res) { return res.json(); })
  // .then(function(data) {
  //   if (data.success) {
  //     onPremiumVerified(data.token);
  //   } else {
  //     onPremiumFailed();
  //   }
  // })
  // .catch(function() { onPremiumFailed(); });
}

function onPremiumVerified(token) {
  var btn = document.getElementById('confirm-pay-btn');
  var err = document.getElementById('pin-error');
  
  err.style.display = 'none';
  btn.innerHTML = '✅ ปลดล็อกสำเร็จ!';
  btn.style.background = '#4CAF50';
  btn.style.color = '#fff';
  btn.disabled = true;
  
  setTimeout(function() {
    setPremiumUnlocked(true, token);
    
    document.querySelectorAll('.is-locked').forEach(function(el) {
      el.classList.remove('is-locked');
      var overlay = el.querySelector('.lock-overlay');
      if(overlay) overlay.remove();
    });
    
    closePayment();
    window.scrollBy({ top: 150, behavior: 'smooth' });
  }, 800);
}

function onPremiumFailed() {
  var btn = document.getElementById('confirm-pay-btn');
  var err = document.getElementById('pin-error');
  
  err.style.display = 'block';
  btn.innerHTML = '❌ กรอกรหัสใหม่อีกครั้ง';
  btn.style.background = '#F44336';
  btn.style.color = '#fff';
  
  setTimeout(function() {
    btn.innerHTML = '🔓 ยืนยันรหัสปลดล็อก';
    btn.style.background = '';
    btn.style.color = '';
  }, 2000);
}

