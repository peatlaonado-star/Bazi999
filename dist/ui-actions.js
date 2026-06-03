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
  if (typeof CL !== 'undefined' && CL === 'en') {
    mantra = "Allow yourself to grow at your own pace, like the moon that never rushes to be full. ☽";
  }

  var html = '<div class="daily-mantra">'
           + '<div class="dm-lbl">✦ กำลังใจประจำวัน ✦</div>'
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
var PREMIUM_TOKEN_STORAGE_KEY = 'starviaPremiumToken';
var _premiumState = { unlocked: false, token: null };

function isPremiumUnlocked() {
  return _premiumState.unlocked;
}

function setPremiumUnlocked(unlocked, token) {
  _premiumState.unlocked = !!unlocked;
  _premiumState.token = token || null;
  // sync backward-compat global flag without replacing the isPremiumUnlocked() function
  window.isPremiumUnlockedFlag = _premiumState.unlocked;
}

function persistPremiumToken(token) {
  if (!token) return;
  var storage = getPremiumStorage();
  if (storage) storage.setItem(PREMIUM_TOKEN_STORAGE_KEY, token);
}

function clearPremiumToken() {
  var storage = getPremiumStorage();
  if (storage) storage.removeItem(PREMIUM_TOKEN_STORAGE_KEY);
}

function getSavedPremiumToken() {
  var storage = getPremiumStorage();
  return storage ? storage.getItem(PREMIUM_TOKEN_STORAGE_KEY) : null;
}

function getPremiumStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (window && window.localStorage) return window.localStorage;
  } catch (error) {
    return null;
  }
  return null;
}

function restorePremiumStatus() {
  var cfg = getStarviaConfig();
  var token = getSavedPremiumToken();
  if (!token) {
    return Promise.resolve({ active: false, mode: 'none' });
  }

  return fetch(cfg.apiBaseUrl + '/premium/status', {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.active) {
      setPremiumUnlocked(true, token);
      return data;
    }
    clearPremiumToken();
    setPremiumUnlocked(false);
    return data || { active: false };
  })
  .catch(function() {
    setPremiumUnlocked(false);
    return { active: false, error: 'NETWORK_ERROR' };
  });
}

// DEPRECATED: use isPremiumUnlocked(); legacy boolean mirror lives at window.isPremiumUnlockedFlag.
window.isPremiumUnlockedFlag = false;

function getStarviaConfig() {
  var cfg = (window && window.STARVIA_CONFIG) ? window.STARVIA_CONFIG : {};
  return {
    apiBaseUrl: (cfg.apiBaseUrl || '').replace(/\/$/, '')
  };
}

restorePremiumStatus();

function callPremiumVerifyApi(pin, cfg) {
  return fetch(cfg.apiBaseUrl + '/premium/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: pin })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.success) {
      onPremiumVerified(data.token || null);
    } else {
      onPremiumFailed();
    }
    return data;
  })
  .catch(function() {
    onPremiumFailed();
    return { success: false, error: 'NETWORK_ERROR' };
  });
}

// 1. เปิดป๊อปอัปชำระเงิน — รองรับ Omise auto-payment + fallback สลิปแมนนวล
var _omisePollTimer = null;
var _omiseChargeId = null;

function openPayment() {
  var overlay = document.getElementById('payment-modal');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'payment-modal';
    overlay.className = 'modal-overlay';

    // โครงสร้างหน้าต่างป๊อปอัป — Omise auto + fallback
    overlay.innerHTML = buildPaymentModalHtml();
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
  _omiseChargeId = null;

  // ลองสร้าง Omise payment อัตโนมัติ
  tryCreateOmisePayment();
}

// ── Build payment modal HTML ──
function buildPaymentModalHtml() {
  return '<div class="modal-content" style="position:relative; max-height: 90vh; overflow-y: auto;">'
    + '<button class="modal-close" data-action="close-payment">✕</button>'
    + '<div style="color:#C9A227; font-size:16px; font-weight:700; margin-bottom:5px;">✦ ปลดล็อกคัมภีร์ดวงชะตา ✦</div>'
    + '<div style="color:#e8dfc8; font-size:12px; margin-bottom:15px;">The Complete Life Blueprint</div>'

    // Price anchoring
    + '<div style="font-size:28px; font-weight:700; color:#fff; margin-bottom:5px;">'
    + '<span style="font-size:14px; color:#8B6914; text-decoration:line-through; margin-right:10px;">590 THB</span>199 THB</div>'
    + '<div style="font-size:11px; color:#4CAF50; font-weight:600; margin-bottom:15px;">🔥 ราคาพิเศษเฉพาะช่วง Early Access</div>'

    // QR area — dynamic (Omise) or static (fallback)
    + '<div id="payment-qr-area">'
    + '<div class="qr-box" style="margin: 0 auto 10px;"><img src="assets/qr-payment.jpg" style="max-width:100%; max-height:100%; object-fit:contain;" alt="QR Code"></div>'
    + '</div>'

    // Payment status (hidden by default, shown when Omise active)
    + '<div id="payment-status" style="display:none; text-align:center; padding:10px; margin-bottom:10px;"></div>'

    // Auto-pay button (shown when Omise available)
    + '<div id="omise-actions" style="display:none;">'
    + '<div style="background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; padding:12px; margin-bottom:15px; text-align:center;">'
    + '<div style="font-size:12px; color:#4CAF50; font-weight:600;">⚡ ชำระอัตโนมัติ — ปลดล็อกทันทีหลังจ่าย</div>'
    + '<div id="omise-countdown" style="font-size:11px; color:#888; margin-top:4px;"></div>'
    + '</div>'
    + '</div>'

    // Fallback: manual slip flow
    + '<div id="manual-payment">'
    + '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:15px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.08);">'
    + '<div class="step-txt"><strong>ขั้นตอนที่ 1:</strong> สแกนชำระเงิน แล้วกดปุ่มเพื่อส่งสลิปให้แอดมิน</div>'
    + '<a href="https://m.me/61573341702581" target="_blank" class="pdf-btn" style="display:block; text-decoration:none; background:linear-gradient(90deg, #2196F3, #1976D2); color:#fff; font-size:13px; padding:12px; margin-bottom:15px; box-shadow:none; animation:none;">💬 ส่งสลิปทาง Inbox</a>'

    + '<div class="step-txt" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:15px;"><strong>ขั้นตอนที่ 2:</strong> นำ "รหัสผ่าน" ที่ได้รับมากรอกที่นี่</div>'
    + '<input type="text" id="pdf-pin" class="pin-input" placeholder="รหัสผ่าน 6 หลัก">'
    + '<button id="confirm-pay-btn" class="pdf-btn" style="width:100%; font-size:14px; padding:12px;" data-action="verify-pin">🔓 ยืนยันรหัสปลดล็อก</button>'
    + '</div>'

    + '<div id="pin-error" style="color:#F44336; font-size:12px; display:none; margin-top:-5px; margin-bottom:10px;">❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</div>'
    + '</div>'

    // Review box
    + '<div style="text-align:left; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px; margin-top: 5px;">'
    + '<div style="font-size: 11px; color: #b8a8d8; margin-bottom: 8px; letter-spacing: 0.05em;">💬 เสียงจากผู้ปลดล็อกคัมภีร์:</div>'
    + '<div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 2px solid #C9A227; margin-bottom: 8px;">'
    + '<div style="font-size: 11.5px; color: #e8dfc8; font-style: italic; line-height: 1.5;">"ตอนแรกนึกว่าจะเหมือนแอปดูดวงทั่วไป แต่พออ่านเรื่องหลุมพรางการงานแล้วขนลุกเลยค่ะ เอาไปปรับใช้ได้จริง คุ้มเกินราคามาก"</div>'
    + '<div style="font-size: 9px; color: #7a6a9a; margin-top: 6px; text-align: right;">— คุณ น. ผู้ทดลองใช้งาน</div>'
    + '</div>'
    + '</div>'

    + '</div>';
}

// ── Try to create Omise payment ──
function tryCreateOmisePayment() {
  var cfg = getStarviaConfig();

  fetch(cfg.apiBaseUrl + '/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: localStorage.getItem('starvia_email') || '',
      returnUrl: window.location.origin + '/payment-success'
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.success && data.qrUrl) {
      showOmiseQr(data);
    }
    // If Omise not configured, keep static QR (fallback)
  })
  .catch(function() {
    // Omise not available — keep static QR fallback
  });
}

// ── Show Omise QR code ──
function showOmiseQr(paymentData) {
  _omiseChargeId = paymentData.chargeId;

  var qrArea = document.getElementById('payment-qr-area');
  var omiseActions = document.getElementById('omise-actions');
  var statusEl = document.getElementById('payment-status');

  if (qrArea) {
    qrArea.innerHTML = '<div class="qr-box" style="margin: 0 auto 10px;">'
      + '<img src="' + paymentData.qrUrl + '" style="max-width:100%; max-height:100%; object-fit:contain;" alt="PromptPay QR">'
      + '</div>'
      + '<div style="text-align:center; font-size:11px; color:#888; margin-top:5px;">สแกนด้วย Mobile Banking ทุกธนาคาร</div>';
  }

  if (omiseActions) {
    omiseActions.style.display = 'block';
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = '⏳ รอการชำระเงิน...';
    statusEl.style.color = '#FFC107';
  }

  // Start polling for payment status
  startPaymentPolling(paymentData.chargeId);
}

// ── Poll payment status ──
function startPaymentPolling(chargeId) {
  stopPaymentPolling();

  var cfg = getStarviaConfig();
  var attempts = 0;
  var maxAttempts = 60; // 5 minutes (5s interval)
  var startTime = Date.now();

  _omisePollTimer = setInterval(function() {
    attempts++;

    // Update countdown
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var remaining = Math.max(0, 300 - elapsed); // 5 min
    var countdownEl = document.getElementById('omise-countdown');
    if (countdownEl) {
      var min = Math.floor(remaining / 60);
      var sec = remaining % 60;
      countdownEl.textContent = 'QR หมดอายุใน ' + min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    if (attempts >= maxAttempts || remaining <= 0) {
      stopPaymentPolling();
      var statusEl = document.getElementById('payment-status');
      if (statusEl) {
        statusEl.innerHTML = '⏰ QR หมดอายุ — กรุณาปิดแล้วลองใหม่';
        statusEl.style.color = '#F44336';
      }
      return;
    }

    fetch(cfg.apiBaseUrl + '/payment/status/' + chargeId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.status === 'paid') {
          stopPaymentPolling();
          onPaymentSuccess(data);
        }
      })
      .catch(function() {});
  }, 5000);
}

function stopPaymentPolling() {
  if (_omisePollTimer) {
    clearInterval(_omisePollTimer);
    _omisePollTimer = null;
  }
}

// ── Payment success callback ──
function onPaymentSuccess(data) {
  var statusEl = document.getElementById('payment-status');
  if (statusEl) {
    statusEl.innerHTML = '✅ ชำระเงินสำเร็จ! กำลังปลดล็อก...';
    statusEl.style.color = '#4CAF50';
  }

  // If PIN returned, auto-verify
  if (data.pin) {
    var cfg = getStarviaConfig();
    callPremiumVerifyApi(data.pin, cfg);
  } else {
    // Direct unlock
    onPremiumVerified(null);
  }
}

function closePayment() {
  stopPaymentPolling();
  document.getElementById('payment-modal').style.display = 'none';
}

// 2. ระบบตรวจรหัสผ่านจาก backend/admin-generated code เท่านั้น
function verifyPin() {
  var pin = document.getElementById('pdf-pin').value.trim().toUpperCase();
  var cfg = getStarviaConfig();

  return callPremiumVerifyApi(pin, cfg);
}

function onPremiumVerified(token) {
  if (token) persistPremiumToken(token);

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

// ===== COLLAPSIBLE SECTIONS =====
function initCollapsibleSections() {
  document.querySelectorAll('.section-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var section = this.closest('.collapsible-section');
      if (section) section.classList.toggle('collapsed');
    });
  });
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

