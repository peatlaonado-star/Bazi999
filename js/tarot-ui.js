// 🎴 Tarot UI — Card picker, flip animation, result display
// Anonymous — ไม่เก็บข้อมูลส่วนตัว

(function() {
  'use strict';

  // ============== State ==============
  let currentCategory = 'love';
  let spreadType = 'single';
  let drawnCard = null;
  let drawnOrientation = null;
  let isAnimating = false;

  // 3-card spread state
  let pickedCards3 = [];  // [{card, orientation, idx}]
  let available3 = [];    // cards available to pick

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
    spreadType = 'single';
    pickedCards3 = [];
    available3 = [];
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
    showTarotStep('spread');
  };

  // ============== Spread Type Selection ==============
  window.selectTarotSpread = function(type) {
    if (type === 'three') {
      // Check premium
      if (!isPremium()) {
        showTarotPremiumUpsell();
        return;
      }
    }
    spreadType = type;
    if (type === 'single') {
      showTarotStep('pick');
      renderTarotPicker();
    } else {
      showTarotStep('pick3');
      renderTarotPicker3();
    }
  };

  // ============== Premium Check ==============
  function isPremium() {
    if (window.starviaIsPremium) return true;
    // Check multiple storage keys (streak-tracker uses 'starvia_premium', premium verify uses 'starvia_premium_token')
    const premiumFlag = localStorage.getItem('starvia_premium');
    if (premiumFlag === 'true') return true;
    const token = localStorage.getItem('starvia_premium_token');
    if (!token) return false;
    // Accept both JWT tokens (eyJ...) and legacy STAR- tokens
    return token.startsWith('STAR-') || token.startsWith('eyJ');
  }
  window.isTarotPremium = isPremium;

  // ============== Premium Upsell ==============
  function showTarotPremiumUpsell() {
    const container = document.getElementById('tarot-limit-content');
    if (container) {
      container.innerHTML = `
        <div class="tarot-limit-icon">👑</div>
        <h3>ฟีเจอร์นี้สำหรับ Premium</h3>
        <p>เปิด 3 ใบ — Past / Present / Future<br>เพื่อทำนายลึกซึ้งกว่าเดิม</p>
        <div class="tarot-limit-tip">
          💎 <strong>Premium</strong> — เปิดไพ่ได้ไม่จำกัด + ทำนาย 3 ใบ + AI ตีความเจาะลึก
        </div>
        <div class="tarot-pin-section">
          <div class="tarot-pin-label">มีรหัส Premium? กรอกรหัสที่นี่</div>
          <div class="tarot-pin-row">
            <input type="text" id="tarot-pin-input" class="tarot-pin-input" 
                   placeholder="STAR-XXXX-XXXX" maxlength="18" autocomplete="off"
                   onkeydown="if(event.key==='Enter')activatePremiumFromPin()">
            <button class="tarot-btn-primary tarot-pin-btn" onclick="activatePremiumFromPin()">เปิดใช้</button>
          </div>
          <div id="tarot-pin-status" class="tarot-pin-status"></div>
        </div>
        <button class="tarot-btn-secondary" onclick="showTarotStep('spread')" style="margin-top:12px">← กลับเลือกวิธีทำนาย</button>
      `;
    }
    showTarotStep('limit');
  }

  // ============== Activate Premium from PIN ==============
  window.activatePremiumFromPin = async function() {
    const input = document.getElementById('tarot-pin-input');
    const status = document.getElementById('tarot-pin-status');
    if (!input || !status) return;

    const pin = input.value.trim().toUpperCase();
    if (!pin) {
      status.innerHTML = '<span style="color:#e8534A">กรุณากรอกรหัส</span>';
      return;
    }

    status.innerHTML = '<span style="color:#C9A227">⏳ กำลังตรวจสอบ...</span>';
    input.disabled = true;

    try {
      const resp = await fetch('/v1/premium/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await resp.json();

      if (data.success && data.token) {
        // Store token in both keys for compatibility
        localStorage.setItem('starvia_premium_token', data.token);
        localStorage.setItem('starvia_premium', 'true');
        window.starviaIsPremium = true;
        
        status.innerHTML = '<span style="color:#32CD32">✅ Premium เปิดใช้แล้ว!</span>';
        input.disabled = true;

        // Reload after short delay to apply premium everywhere
        setTimeout(() => { window.location.reload(); }, 1200);
      } else {
        status.innerHTML = '<span style="color:#e8534A">❌ ' + (data.message || 'รหัสไม่ถูกต้อง') + '</span>';
        input.disabled = false;
        input.focus();
      }
    } catch (err) {
      status.innerHTML = '<span style="color:#e8534A">❌ เกิดข้อผิดพลาด — ลองใหม่</span>';
      input.disabled = false;
    }
  };

  // ============== Go to Spread Step (back button for pick3) ==============
  window.goToSpreadStep = function() {
    pickedCards3 = [];
    available3 = [];
    showTarotStep('spread');
  };

  // ============== 3-Card Picker ==============
  function renderTarotPicker3() {
    const container = document.getElementById('tarot-picker3-cards');
    if (!container) return;
    pickedCards3 = [];
    // Random 6 cards for user to pick 3 from
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    available3 = shuffled.slice(0, 6);
    container.innerHTML = available3.map((c, i) => `
      <div class="tarot-card-back" data-card-id="${c.id}" data-idx="${i}" onclick="pickTarotCard3(${c.id}, ${i})">
        <div class="tarot-card-back-inner">
          <div class="tarot-card-pattern">✦</div>
          <div class="tarot-card-pattern tarot-card-pattern-2">✦</div>
          <div class="tarot-card-label">ไพ่ใบที่ ${i + 1}</div>
        </div>
      </div>
    `).join('');
    updatePick3Counter();
  }

  function updatePick3Counter() {
    const counterEl = document.getElementById('tarot-pick3-counter');
    if (counterEl) {
      counterEl.textContent = `เลือกแล้ว ${pickedCards3.length} / 3 ใบ`;
    }
  }

  // ============== Pick Card (3-Card Mode) ==============
  window.pickTarotCard3 = function(cardId, idx) {
    if (isAnimating) return;
    if (pickedCards3.length >= 3) return;

    // Check premium
    if (!isPremium()) {
      showTarotPremiumUpsell();
      return;
    }

    const card = TAROT_CARDS.find(c => c.id === cardId);
    if (!card) return;

    isAnimating = true;
    const orientation = Math.random() < 0.5 ? 'up' : 'down';

    pickedCards3.push({ card, orientation, idx });

    // Flip the picked card
    const back = document.querySelector(`#tarot-picker3-cards .tarot-card-back[data-idx="${idx}"]`);
    if (back) {
      back.classList.add('flipping');
      setTimeout(() => {
        back.classList.add('flipped');
        back.innerHTML = `
          <div class="tarot-card-front">
            <div class="tarot-card-emoji">${card.emoji}</div>
            <div class="tarot-card-name-thai">${card.thai}</div>
            <div class="tarot-card-name-en">${card.name}</div>
            <div class="tarot-card-symbol">${card.symbol}</div>
          </div>
        `;
        updatePick3Counter();
        if (pickedCards3.length >= 3) {
          setTimeout(() => {
            showTarotResult3();
            isAnimating = false;
          }, 1200);
        } else {
          isAnimating = false;
        }
      }, 300);
    } else {
      updatePick3Counter();
      if (pickedCards3.length >= 3) {
        showTarotResult3();
      }
      isAnimating = false;
    }
  };

  // ============== Show Result (3-Card Spread) ==============
  function showTarotResult3() {
    const category = TAROT_CATEGORIES.find(c => c.id === currentCategory);
    const labels = ['🔮 อดีต (Past)', '✨ ปัจจุบัน (Present)', '🌟 อนาคต (Future)'];

    const resultEl = document.getElementById('tarot-result-content');
    if (!resultEl) return;

    let cardsHtml = pickedCards3.map((item, i) => {
      const { card, orientation } = item;
      const meaning = card.meaning[currentCategory][orientation];
      const oriText = orientation === 'up' ? 'ตั้ง' : 'กลับหัว';
      const oriEmoji = orientation === 'up' ? '⬆️' : '⬇️';
      const posClass = ['tarot-past', 'tarot-present', 'tarot-future'][i];

      // Use card image if available, otherwise emoji
      const cardImage = card.image || null;
      const imageHtml = cardImage 
        ? `<div class="tarot-result-image"><img src="${cardImage}" alt="${card.thai}" loading="lazy"></div>`
        : `<div class="tarot-result-emoji">${card.emoji}</div>`;

      return `
        <div class="tarot-result-3card ${posClass} ${orientation === 'down' ? 'reversed' : ''}">
          <div class="tarot-result-3card-label">${labels[i]}</div>
          <div class="tarot-result-card-inner">
            ${imageHtml}
            <div class="tarot-result-name-thai">${card.thai}</div>
            <div class="tarot-result-name-en">${card.name}</div>
            <div class="tarot-result-orientation">${oriEmoji} ${oriText}</div>
            <div class="tarot-result-divider"></div>
            <div class="tarot-result-meaning">${meaning}</div>
          </div>
        </div>
      `;
    }).join('');

    // Combined interpretation
    const combinedText = buildCombinedInterpretation();

    resultEl.innerHTML = `
      <div class="tarot-result-3cards">
        <div class="tarot-result-category">${category.emoji} ${category.name}</div>
        ${cardsHtml}
      </div>
      <div class="tarot-result-combined">
        <div class="tarot-result-combined-label">📖 สรุปทำนาย</div>
        <div class="tarot-result-combined-text">${combinedText}</div>
        <div class="tarot-result-keywords">
          ${getCombinedKeywords().map(k => `<span class="tarot-keyword">${k}</span>`).join('')}
        </div>
      </div>
    `;

    // Track event
    if (typeof trackEvent === 'function') {
      trackEvent('tarot_draw_3card', {
        cards: pickedCards3.map(p => p.card.name).join(', '),
        category: currentCategory,
        spread: 'past_present_future'
      });
    }

    showTarotStep('result');
  }

  // ============== Combined Interpretation ==============
  function buildCombinedInterpretation() {
    if (pickedCards3.length < 3) return '';
    const past = pickedCards3[0].card.meaning[currentCategory][pickedCards3[0].orientation];
    const present = pickedCards3[1].card.meaning[currentCategory][pickedCards3[1].orientation];
    const future = pickedCards3[2].card.meaning[currentCategory][pickedCards3[2].orientation];

    return `จากอดีต "${past}" มาสู่ปัจจุบัน "${present}" และในอนาคต "${future}" — ดวงบ่งบอกว่าเส้นทางจากอดีตสู่ปัจจุบันกำลังนำพาไปสู่อนาคตที่น่าจับตา ให้ใส่ใจกับสัญญาณที่ไพ่บอก แล้วชีวิตจะเดินไปในทิศทางที่ดี`;
  }

  function getCombinedKeywords() {
    const allKw = new Set();
    pickedCards3.forEach(p => {
      p.card.keywords.forEach(k => allKw.add(k));
    });
    return [...allKw].slice(0, 5);
  }

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
        // Use card image if available, otherwise emoji
        const cardImage = card.image || null;
        const imageHtml = cardImage 
          ? `<div class="tarot-card-image"><img src="${cardImage}" alt="${card.thai}" loading="lazy"></div>`
          : `<div class="tarot-card-emoji">${card.emoji}</div>`;
        
        back.innerHTML = `
          <div class="tarot-card-front">
            ${imageHtml}
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
      // Use card image if available, otherwise emoji
      const cardImage = drawnCard.image || null;
      const imageHtml = cardImage 
        ? `<div class="tarot-result-image"><img src="${cardImage}" alt="${drawnCard.thai}" loading="lazy"></div>`
        : `<div class="tarot-result-emoji">${drawnCard.emoji}</div>`;
      
      resultEl.innerHTML = `
        <div class="tarot-result-card ${drawnOrientation === 'down' ? 'reversed' : ''}">
          ${imageHtml}
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
        <div class="tarot-ai-section">
          <button class="tarot-ai-btn" onclick="requestAIInterpretation()">
            🤖 ให้ AI ตีความเจาะลึก
          </button>
          <div id="tarot-ai-result" style="display:none"></div>
        </div>
      `;
    }

    // Track event
    if (typeof trackEvent === 'function') {
      trackEvent('tarot_draw', { card: drawnCard.name, category: currentCategory, orientation: drawnOrientation });
    }

    showTarotStep('result');
  }

  // ============== AI Interpretation ==============
  window.requestAIInterpretation = async function() {
    if (!drawnCard) return;
    const resultEl = document.getElementById('tarot-ai-result');
    const btn = document.querySelector('.tarot-ai-btn');
    if (!resultEl || !btn) return;

    // Show loading
    btn.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="tarot-ai-loading">🔮 กำลังตีความ...</div>';

    const category = TAROT_CATEGORIES.find(c => c.id === currentCategory);
    const oriText = drawnOrientation === 'up' ? 'ตั้ง' : 'กลับหัว';
    const question = 'ทำนายไพ่ทาโร่: ' + drawnCard.thai + ' (' + drawnCard.name + ') ' + oriText + ' หมวด' + category.name + '. อธิบายความหมายเชิงลึก พร้อมคำแนะนำ';

    // Get birthdate from localStorage if available
    const birthDate = localStorage.getItem('starvia_birthdate') || '';

    try {
      const resp = await fetch('/v1/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'tarot-ai-' + Date.now(),
          params: {
            skillId: 'chat_consultation',
            input: { question: question, birthDate: birthDate }
          }
        })
      });
      const data = await resp.json();
      if (data.success && data.result && data.result.reply) {
        resultEl.innerHTML = '<div class="tarot-ai-content">' + data.result.reply + '</div>';
      } else {
        resultEl.innerHTML = '<div class="tarot-ai-error">ขออภัย AI ไม่สามารถตีความได้ในตอนนี้</div>';
      }
    } catch (err) {
      resultEl.innerHTML = '<div class="tarot-ai-error">เกิดข้อผิดพลาด — ลองใหม่อีกครั้ง</div>';
    }
  };

  // ============== Daily Limit ==============
  function showTarotLimit() {
    const limitEl = document.getElementById('tarot-limit-content');
    if (limitEl) {
      limitEl.innerHTML = `
        <div class="tarot-limit-icon">🌙</div>
        <h3>ใบเดียวต่อวัน — เปิดใหม่พรุ่งนี้</h3>
        <p>ดวงบอกว่าการเปิดซ้ำในวันเดียวกันจะ "เบลอ" พลังงานของไพ่</p>
        <p class="tarot-limit-tip">💎 <strong>Premium</strong> เปิดไพ่ได้ไม่จำกัด + AI ตีความเจาะลึก</p>
        <div class="tarot-pin-section">
          <div class="tarot-pin-label">มีรหัส Premium? กรอกรหัสที่นี่</div>
          <div class="tarot-pin-row">
            <input type="text" id="tarot-pin-input-limit" class="tarot-pin-input" 
                   placeholder="STAR-XXXX-XXXX" maxlength="18" autocomplete="off"
                   onkeydown="if(event.key==='Enter')activatePremiumFromPinLimit()">
            <button class="tarot-btn-primary tarot-pin-btn" onclick="activatePremiumFromPinLimit()">เปิดใช้</button>
          </div>
          <div id="tarot-pin-status-limit" class="tarot-pin-status"></div>
        </div>
        <button class="tarot-btn-secondary" onclick="closeTarot()" style="margin-top:12px">กลับหน้าหลัก</button>
      `;
    }
    showTarotStep('limit');
  }

  // ============== Activate Premium from PIN (Daily Limit) ==============
  window.activatePremiumFromPinLimit = async function() {
    const input = document.getElementById('tarot-pin-input-limit');
    const status = document.getElementById('tarot-pin-status-limit');
    if (!input || !status) return;

    const pin = input.value.trim().toUpperCase();
    if (!pin) {
      status.innerHTML = '<span style="color:#e8534A">กรุณากรอกรหัส</span>';
      return;
    }

    status.innerHTML = '<span style="color:#C9A227">⏳ กำลังตรวจสอบ...</span>';
    input.disabled = true;

    try {
      const resp = await fetch('/v1/premium/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await resp.json();

      if (data.success && data.token) {
        localStorage.setItem('starvia_premium_token', data.token);
        localStorage.setItem('starvia_premium', 'true');
        window.starviaIsPremium = true;
        
        status.innerHTML = '<span style="color:#32CD32">✅ Premium เปิดใช้แล้ว!</span>';
        setTimeout(() => { window.location.reload(); }, 1200);
      } else {
        status.innerHTML = '<span style="color:#e8534A">❌ ' + (data.message || 'รหัสไม่ถูกต้อง') + '</span>';
        input.disabled = false;
        input.focus();
      }
    } catch (err) {
      status.innerHTML = '<span style="color:#e8534A">❌ เกิดข้อผิดพลาด — ลองใหม่</span>';
      input.disabled = false;
    }
  };

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
    spreadType = 'single';
    pickedCards3 = [];
    available3 = [];
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

// Daily Card on Homepage
(function() {
  const today = new Date().toISOString().split('T')[0];
  const daily = getDailyCard(today);

  // Render date
  const dateEl = document.querySelector('.daily-tarot-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = '🃏 ไพ่ประจำวัน — ' + d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' });
  }

  // Render back of card
  const backEl = document.querySelector('.daily-tarot-back');
  if (backEl) {
    backEl.innerHTML = '<div class="daily-tarot-emoji">' + daily.card.emoji + '</div>'
      + '<div class="daily-tarot-name">' + daily.card.thai + '</div>'
      + '<div class="daily-tarot-orientation">' + (daily.orientation === 'up' ? '⬆️ ตั้ง' : '⬇️ กลับหัว') + '</div>';
  }

  window.flipDailyTarot = function() {
    const card = document.querySelector('.daily-tarot-card');
    const meaningEl = document.querySelector('.daily-tarot-meaning');
    const shareBtn = document.querySelector('.daily-tarot-share');
    if (card) card.classList.add('flipped');
    if (meaningEl) {
      const meaning = daily.card.meaning.general[daily.orientation];
      meaningEl.innerHTML = '<p>' + meaning + '</p>';
      meaningEl.style.display = 'block';
    }
    if (shareBtn) shareBtn.style.display = 'inline-block';
  };

  window.shareDailyTarot = function() {
    const text = '🃏 ไพ่ประจำวัน STARVIA\n' + daily.card.thai + ' (' + daily.card.name + ') ' + daily.card.emoji + '\n' + (daily.orientation === 'up' ? '⬆️ ตั้ง' : '⬇️ กลับหัว') + '\n\n✨ ' + daily.card.meaning.general[daily.orientation] + '\n\n#STARVIA #ไพ่ประจำวัน';
    if (navigator.share) {
      navigator.share({ title: 'ไพ่ประจำวัน STARVIA', text: text, url: 'https://starvia.website' }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };
})();