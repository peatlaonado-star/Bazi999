/* STARVIA · Pick a Card — ใช้ข้อมูลไพ่ 78 ใบจริง + API quota/streak จริง */
const $ = (id) => document.getElementById(id);

const API = "/v1/pick";

const state = {
  member: true,
  quotaLeft: 1,
  streak: 0,
  topic: null,
  history: [],
};

const TOPIC_LABEL = { career: "การงาน", money: "การเงิน", love: "ความรัก", health: "สุขภาพ" };
const TOPIC_ICON = { career: "💼", money: "💰", love: "💕", health: "🌿" };
const CARD_IMG = (slug) => `cards/${slug}.png`;

/* ── Screen switcher ─────────────────────── */
const SCREENS = ["scrTopic", "scrFan", "scrReveal", "scrHistory", "scrGate"];
function show(id) {
  SCREENS.forEach((s) => $(s).classList.toggle("on", s === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── Boot ───────────────────────────────── */
async function loadState() {
  try {
    const r = await fetch(`${API}/state`);
    const d = await r.json();
    if (d.success) {
      state.quotaLeft = d.quotaLeft;
      state.streak = d.streak;
      state.history = d.history || [];
    }
  } catch (e) {
    console.warn("pick state API ไม่พร้อม — ใช้โหมด offline", e);
  }
  renderMeta();
  renderHistory();
  show(state.member ? "scrTopic" : "scrGate");
}

function boot() {
  const th = new Date().toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  $("todayText").textContent = th;
  loadState();
}

function renderMeta() {
  $("streakVal").textContent = `${state.streak} วัน`;
  $("quotaVal").textContent = state.quotaLeft > 0 ? `${state.quotaLeft} ครั้ง` : "หมดแล้ว";
  $("historyCount").textContent = state.history.length;
}

/* ── เลือกไพ่ตามหัวข้อ ──────────────────── */
function getCardsForTopic(topic) {
  const all = window.CARD_DATA || [];
  // สุ่ม 7 ใบจากไพ่ทั้งหมดที่เข้ากับหัวข้อ (หรือทุกใบถ้าไม่มี filter)
  const filtered = all.filter(c => c.topic === topic || Math.random() > 0.6);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7);
}

/* ── Topic → Fan ────────────────────────── */
$("topicGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".tp");
  if (!btn) return;
  state.topic = btn.dataset.topic;
  $("fanTopicTitle").textContent = `${TOPIC_ICON[state.topic]} ${TOPIC_LABEL[state.topic]}`;
  buildFan();
  show("scrFan");
});

function buildFan() {
  const row = $("fanRow");
  row.innerHTML = "";
  const cards = getCardsForTopic(state.topic);
  state.fanCards = cards; // เก็บไว้ใช้ตอน pick
  const N = cards.length;
  const spread = 26;
  for (let i = 0; i < N; i++) {
    const t = i - (N - 1) / 2;
    const card = cards[i];
    const c = document.createElement("button");
    c.className = "card-f";
    c.setAttribute("role", "option");
    c.setAttribute("aria-label", card.name);
    c.style.setProperty("--rot", `${(t * spread) / (N / 2)}deg`);
    c.style.setProperty("--x", `${t * 40}px`);
    c.style.setProperty("--y", `${Math.abs(t) * 7}px`);
    c.style.transitionDelay = `${i * 40}ms`;

    // ใส่ภาพไพ่
    const img = document.createElement("img");
    img.src = CARD_IMG(card.slug);
    img.alt = card.name;
    img.className = "card-f-img";
    img.loading = "lazy";
    c.appendChild(img);

    c.addEventListener("click", () => pickCard(c, i));
    row.appendChild(c);
  }
}

/* ── Pick → Reveal ──────────────────────── */
async function pickCard(el, idx) {
  if (state.quotaLeft <= 0) return;
  const card = state.fanCards[idx];

  // บันทึกการเปิดไพ่ผ่าน API (หัก quota จริง) — fallback offline ถ้า API ไม่พร้อม
  try {
    const r = await fetch(`${API}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: state.topic,
        slug: card.slug,
        name: card.name,
        emoji: card.emoji,
      }),
    });
    const d = await r.json();
    if (!d.success) {
      alert(d.message || "วันนี้เปิดไพ่ครบ 1 ครั้งแล้ว พรุ่งนี้มาใหม่นะคะ ✨");
      return;
    }
    state.quotaLeft = d.quotaLeft;
    state.streak = d.streak;
    state.history = d.history || state.history;
  } catch (e) {
    console.warn("draw API ไม่พร้อม — เปิดแบบ offline (ไม่บันทึก)", e);
    state.quotaLeft -= 1;
    state.streak += 1;
    state.history.unshift({
      date: new Date().toISOString(), card: card.name, emoji: card.emoji,
      topic: TOPIC_LABEL[state.topic], slug: card.slug,
    });
  }

  el.classList.add("sel");
  document.querySelectorAll(".card-f").forEach((c) => {
    if (c !== el) c.style.pointerEvents = "none";
  });

  setTimeout(() => {
    fillReveal(card);
    show("scrReveal");
    requestAnimationFrame(() =>
      setTimeout(() => $("rvFlip").classList.add("flip"), 250)
    );
  }, 420);
}

function fillReveal(card) {
  $("rvFlip").classList.remove("flip");

  // ใส่ภาพไพ่ในหน้า reveal
  const frontFace = $("rvCardFace");
  frontFace.innerHTML = "";
  const img = document.createElement("img");
  img.src = CARD_IMG(card.slug);
  img.alt = card.name;
  img.className = "rv-card-img";
  frontFace.appendChild(img);

  $("rvName").textContent = card.name;
  $("rvSub").textContent = card.sub;
  $("rvTopicLabel").textContent = TOPIC_LABEL[state.topic];
  $("rvReading").textContent = card.reading;
  $("rvNum").textContent = card.num;
  $("rvColor").textContent = card.color;
  $("rvDo").textContent = card.do;
  $("rvDont").textContent = card.dont;
  renderMeter(card.pos);
}

/* ── ระดับความมงคล (meter) ──────────────── */
function renderMeter(pos) {
  const fill = $("rvPosFill");
  const pct = $("rvPosPct");
  const tag = $("rvPosTag");
  fill.classList.remove("mid", "low");
  tag.classList.remove("high", "mid", "low");
  fill.style.width = "0%";

  let label = "";
  let cls = "high";
  if (pos >= 75) {
    label = "✨ ดวงดีมาก — วันที่จักรวาลหนุน";
  } else if (pos >= 45) {
    label = "🌤️ ดวงกลางๆ — ทำดีได้ดี ทำเสี่ยงก็ต้องระวัง";
    cls = "mid";
    fill.classList.add("mid");
  } else {
    label = "🌧️ ต้องระวัง — ค่อยๆ ใช้ชีวิตแบบมีสติ";
    cls = "low";
    fill.classList.add("low");
  }

  pct.textContent = `${pos}%`;
  tag.textContent = label;
  tag.classList.add(cls);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = `${pos}%`;
  }));
}

/* ── History ────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "วันนี้";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function renderHistory() {
  const list = $("hsList");
  list.innerHTML = "";
  if (!state.history.length) {
    list.innerHTML = '<div class="hs-empty">ยังไม่มีประวัติ — เริ่มหยิบใบแรกกันเถอะ ✨</div>';
    $("hsStreakN").textContent = "0 วันติดต่อกัน";
    return;
  }
  state.history.forEach((h) => {
    const it = document.createElement("div");
    it.className = "hs-item";
    const slug = h.slug || h.card.toLowerCase().replace(/ /g, "_").replace("of_", "").replace("__", "_");
    it.innerHTML = `
      <img src="${CARD_IMG(slug)}" class="hs-card-img" alt="${h.card}" loading="lazy">
      <div class="hs-info">
        <div class="hs-card-n">${h.card}</div>
        <div class="hs-meta">${fmtDate(h.date)}</div>
      </div>
      <div class="hs-topic">${h.topic}</div>`;
    list.appendChild(it);
  });
  $("hsStreakN").textContent = `${state.streak} วันติดต่อกัน`;
}

/* ── Nav wiring ─────────────────────────── */
$("btnBackTopic").addEventListener("click", () => show("scrTopic"));
$("btnHistory").addEventListener("click", () => { renderHistory(); show("scrHistory"); });
$("btnBackHome").addEventListener("click", () => show("scrTopic"));
$("btnShare").addEventListener("click", () => {
  alert("📤 เดี๋ยวขั้นต่อไปจะ gen การ์ดรูปสวยๆ ให้แชร์ลง Facebook ค่ะ");
});
$("btnTomorrow").addEventListener("click", () => {
  alert("🔔 เปิดการแจ้งเตือนสำเร็จ (mock) — ตอนนี้พรุ่งนี้ 07:00 จะเตือนค่ะ");
});
$("btnSubscribe").addEventListener("click", () => {
  window.open("https://www.facebook.com/", "_blank");
});

boot();
