// 🎴 Tarot UI — Card picker, flip animation, result display
// Anonymous — ไม่เก็บข้อมูลส่วนตัว

(function() {
  'use strict';

  // ============== State ==============
  let currentCategory = 'love';
  let drawnCard = null;
  let drawnOrientation = null;
  let isAnimating = false;

  // ============== Open/Close Modal ==============
  window.openTarot = function() {
    const modal = document.getElementById('tarot-modal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Reset to category selection
    showTarotStep('category');
    // Trap focus inside modal (a11y)
    trapFocus(modal);
  };

  window.closeTarot = function() {
    const modal = document.getElementById('tarot-modal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset state
    drawnCard = null;
    drawnOrientation = null;
    isAnimating = false;
    // Release focus trap (a11y)
    releaseFocus(modal);
  };

  // ============== Focus Trap (a11y) ==============
  // เมื่อ modal เปิด จะกักโฟกัสไว้ภายใน modal เท่านั้น
  // รองรับ Shift+Tab และ Tab กลับมาที่จุดเริ่มต้น
  function trapFocus(modal) {
    if (!modal) return;
    const focusableEls = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length === 0) return;

    const firstFocusable = focusableEls[0];
    const lastFocusable = focusableEls[focusableEls.length - 1];

    // Store previously focused element เพื่อคืนโฟกัสเมื่อปิด modal
    modal._previouslyFocused = document.activeElement;

    // Focus ที่ element แรกใน modal
    try { firstFocusable.focus(); } catch (_) {}

    // จัดการ keydown: กัก Tab ไม่ให้ออกจาก modal
    modal._keydownHandler = function(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', modal._keydownHandler);
  }

  // ปลดล็อก focus trap และคืนโฟกัสไปยัง element เดิมก่อน modal เปิด
  function releaseFocus(modal) {
    if (!modal) return;
    if (modal._keydownHandler) {
      modal.removeEventListener('keydown', modal._keydownHandler);
      modal._keydownHandler = null;
    }
    if (modal._previouslyFocused && typeof modal._previouslyFocused.focus === 'function') {
      try { modal._previouslyFocused.focus(); } catch (_) {}
    }
    modal._previouslyFocused = null;
  }

  // Expose ให้ไฟล์อื่นเรียกใช้ได้
  window.trapFocus = trapFocus;
  window.releaseFocus = releaseFocus;

  function showTarotStep(step) {
    document.querySelectorAll('.tarot-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('tarot-step-' + step);
    if (target) target.classList.add('active');
  }

  // ============== Category Selection ==============
  window.selectTarotCategory = function(catId) {
    currentCategory = catId;
    showTarotStep('pick');
    // Build picker cards
    renderTarotPicker();
  };

  // ============== Card Picker (3 face-down cards) ==============
  function renderTarotPicker() {
    const container = document.getElementById('tarot-picker-cards');
    if (!container) return;
    // Random 3 cards from the deck
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 3);
    container.innerHTML = chosen.map((c, i) => `
      <div class="tarot-card-back" data-card-id="${c.id}" data-idx="${i}" onclick="pickTarotCard(${c.id}, ${i})">
        <div class="tarot-card-back-inner">
          <div class="tarot-card-pattern">✦</div>
          <div class="tarot-card-pattern tarot-card-pattern-2">✦</div>
          <div class="tarot-card-label">ไพ่ใบที่ ${i + 1}</div>
        </div>
      </div>
    `).join('');
  }

  // ============== Pick a Card ==============
  window.pickTarotCard = function(cardId, idx) {
    if (isAnimating) return;
    isAnimating = true;

    // Check daily limit (free tier)
    if (!canDrawFree()) {
      showTarotLimit();
      isAnimating = false;
      return;
    }

    const card = TAROT_CARDS.find(c => c.id === cardId);
    if (!card) return;

    // Random orientation (upright or reversed)
    drawnOrientation = Math.random() < 0.5 ? 'up' : 'down';
    drawnCard = card;

    // Increment count
    incrementDailyCardCount();

    // Flip the picked card
    const back = document.querySelector(`.tarot-card-back[data-idx="${idx}"]`);
    if (back) {
      back.classList.add('flipping');
      setTimeout(() => {
        // Replace with flipped card
        back.classList.add('flipped');
        back.innerHTML = `
          <div class="tarot-card-front">
            <div class="tarot-card-emoji">${card.emoji}</div>
            <div class="tarot-card-name-thai">${card.thai}</div>
            <div class="tarot-card-name-en">${card.name}</div>
            <div class="tarot-card-symbol">${card.symbol}</div>
          </div>
        `;
        setTimeout(() => {
          showTarotResult();
          isAnimating = false;
        }, 1200);
      }, 300);
    } else {
      showTarotResult();
      isAnimating = false;
    }
  };

  // ============== Show Result ==============
  function showTarotResult() {
    if (!drawnCard) return;
    const category = TAROT_CATEGORIES.find(c => c.id === currentCategory);
    const meaning = drawnCard.meaning[currentCategory][drawnOrientation];
    const oriText = drawnOrientation === 'up' ? 'ตั้ง' : 'กลับหัว';
    const oriEmoji = drawnOrientation === 'up' ? '⬆️' : '⬇️';

    const resultEl = document.getElementById('tarot-result-content');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="tarot-result-card ${drawnOrientation === 'down' ? 'reversed' : ''}">
          <div class="tarot-result-emoji">${drawnCard.emoji}</div>
          <div class="tarot-result-name-thai">${drawnCard.thai}</div>
          <div class="tarot-result-name-en">${drawnCard.name}</div>
          <div class="tarot-result-orientation">${oriEmoji} ${oriText}</div>
          <div class="tarot-result-divider"></div>
          <div class="tarot-result-category">${category.emoji} ${category.name}</div>
          <div class="tarot-result-meaning">${meaning}</div>
          <div class="tarot-result-keywords">
            ${drawnCard.keywords.map(k => `<span class="tarot-keyword">${k}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Track event
    if (typeof trackEvent === 'function') {
      trackEvent('tarot_draw', { card: drawnCard.name, category: currentCategory, orientation: drawnOrientation });
    }

    showTarotStep('result');
  }

  // ============== Daily Limit ==============
  function showTarotLimit() {
    const limitEl = document.getElementById('tarot-limit-content');
    if (limitEl) {
      limitEl.innerHTML = `
        <div class="tarot-limit-icon">🌙</div>
        <h3>ใบเดียวต่อวัน — เปิดใหม่พรุ่งนี้</h3>
        <p>ดวงบอกว่าการเปิดซ้ำในวันเดียวกันจะ "เบลอ" พลังงานของไพ่</p>
        <p class="tarot-limit-tip">💎 <strong>Premium</strong> เปิดไพ่ได้ไม่จำกัด + AI ตีความเจาะลึก</p>
        <button class="tarot-btn-primary" onclick="closeTarot()">กลับหน้าหลัก</button>
      `;
    }
    showTarotStep('limit');
  }

  // ============== Share ==============
  window.shareTarotResult = function() {
    if (!drawnCard) return;
    const category = TAROT_CATEGORIES.find(c => c.id === currentCategory);
    const text = buildShareText(drawnCard, category, drawnOrientation);
    if (navigator.share) {
      navigator.share({
        title: 'STARVIA ไพ่ทำนาย',
        text: text,
        url: 'https://starvia.website'
      }).catch(() => {
        // User cancelled or share failed — fallback to copy
        copyTarotText(text);
      });
    } else {
      copyTarotText(text);
    }
  };

  function copyTarotText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showTarotToast('📋 คัดลอกข้อความแล้ว!');
      }).catch(() => {
        showTarotToast('❌ ไม่สามารถคัดลอกได้');
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showTarotToast('📋 คัดลอกข้อความแล้ว!');
      } catch (e) {
        showTarotToast('❌ ไม่สามารถคัดลอกได้');
      }
      document.body.removeChild(ta);
    }
  }

  function showTarotToast(msg) {
    let toast = document.getElementById('tarot-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tarot-toast';
      toast.className = 'tarot-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // ============== Reset ==============
  window.resetTarot = function() {
    drawnCard = null;
    drawnOrientation = null;
    isAnimating = false;
    showTarotStep('category');
  };

  // ============== Close on outside click ==============
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('tarot-modal');
    if (modal && modal.classList.contains('active') && e.target === modal) {
      closeTarot();
    }
  });

  // ============== ESC key (a11y) ==============
  // ปิด modal ที่เปิดอยู่เมื่อกด Escape — รองรับทั้ง class-based และ aria-hidden state
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    // หา modal ที่เปิดอยู่ (รองรับหลายรูปแบบ)
    const openModal = document.querySelector(
      '.tarot-modal.open, .tarot-modal[aria-hidden="false"], #tarot-modal.active, #tarot-modal[aria-hidden="false"]'
    );
    if (openModal) {
      // หาปุ่มปิดและ trigger click — ให้ระบบปิดผ่าน close handler ที่มีอยู่
      const closeBtn = openModal.querySelector('.modal-close, [data-action="close"], .tarot-close');
      if (closeBtn) {
        closeBtn.click();
      } else if (typeof window.closeTarot === 'function') {
        // Fallback: เรียก closeTarot() ตรงๆ
        window.closeTarot();
      }
    }
  });

})();