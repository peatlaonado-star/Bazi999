// Starvia Chat Concierge Widget — floating chat popup
// เปิด / ปิด / ส่งข้อความ / แสดง typing / quick replies

(function () {
  'use strict';

  const API_PATH = ((window.STARVIA_CONFIG && window.STARVIA_CONFIG.apiBaseUrl) || '') + '/v1/chat';
  const STORAGE_KEY = 'starvia_chat_history';
  const MAX_HISTORY = 10;

  // ── State ──
  let isOpen = false;
  let isLoading = false;
  let history = [];

  // Load history
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) history = JSON.parse(saved);
  } catch (e) {}

  // ── Inject HTML ──
  function injectHTML() {
    if (document.getElementById('starvia-chat-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'starvia-chat-btn';
    btn.setAttribute('aria-label', 'เปิดแชทดูดวง');
    btn.innerHTML = '✨';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'starvia-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'แชทดูดวง AI');
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-avatar">🌙</div>
        <div>
          <div class="chat-title">ดารา · AI ที่ปรึกษาดวง</div>
          <div class="chat-subtitle">ตอบเฉพาะเรื่องดวงชะตา นพเคราะห์</div>
        </div>
        <button class="chat-close" aria-label="ปิด">×</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-quick" id="chat-quick"></div>
      <div class="chat-input">
        <input type="text" id="chat-input" placeholder="ถามเรื่องดวง..." maxlength="500" autocomplete="off" />
        <button id="chat-send" aria-label="ส่ง">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('.chat-close').addEventListener('click', toggle);
    const input = document.getElementById('chat-input');
    const send = document.getElementById('chat-send');
    send.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isLoading) handleSend();
    });
  }

  function toggle() {
    isOpen = !isOpen;
    const panel = document.getElementById('starvia-chat-panel');
    if (isOpen) {
      panel.classList.add('open');
      renderMessages();
      renderQuickReplies();
      document.getElementById('chat-input').focus();
    } else {
      panel.classList.remove('open');
    }
  }

  // ── Render ──
  function renderMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    if (history.length === 0) {
      appendBotMessage('สวัสดีค่ะ ดิฉันดารา AI ที่ปรึกษาดวงชะตา มีอะไรให้ช่วยไหมคะ?');
    } else {
      history.forEach((m) => {
        if (m.role === 'user') appendUserMessage(m.text, false);
        else appendBotMessage(m.text, false);
      });
    }
    container.scrollTop = container.scrollHeight;
  }

  function renderQuickReplies() {
    const container = document.getElementById('chat-quick');
    const replies = [
      'ดวงวันนี้',
      'ดวงความรัก',
      'ดวงการงาน',
      'พรีเมียมต่างจากฟรียังไง?',
    ];
    container.innerHTML = replies
      .map((r) => `<button data-q="${r.replace(/"/g, '&quot;')}">${r}</button>`)
      .join('');
    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('chat-input').value = btn.dataset.q;
        handleSend();
      });
    });
  }

  function appendUserMessage(text, animate = true) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    container.appendChild(div);
    if (animate) container.scrollTop = container.scrollHeight;
  }

  function appendBotMessage(text, animate = true) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.textContent = text;
    container.appendChild(div);
    if (animate) container.scrollTop = container.scrollHeight;
  }

  function appendErrorMessage(text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg error';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function appendTyping() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot typing';
    div.id = 'chat-typing';
    div.textContent = 'กำลังอ่านดวง...';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('chat-typing');
    if (t) t.remove();
  }

  // ── Send ──
  async function handleSend() {
    if (isLoading) return;
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    isLoading = true;
    document.getElementById('chat-send').disabled = true;

    appendUserMessage(text);
    history.push({ role: 'user', text });
    saveHistory();
    appendTyping();

    try {
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      removeTyping();
      if (data.success) {
        appendBotMessage(data.reply);
        history.push({ role: 'bot', text: data.reply });
        saveHistory();
      } else {
        appendErrorMessage(data.message || 'ขออภัย เกิดข้อผิดพลาด');
      }
    } catch (err) {
      removeTyping();
      appendErrorMessage('ไม่สามารถเชื่อมต่อได้ ลองอีกครั้งนะคะ');
    } finally {
      isLoading = false;
      document.getElementById('chat-send').disabled = false;
    }
  }

  function saveHistory() {
    try {
      const trimmed = history.slice(-MAX_HISTORY * 2);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHTML);
  } else {
    injectHTML();
  }
})();
