// Starvia A/B Testing — split traffic 50/50 + measure conversion
// เก็บ variant ใน localStorage + ส่งไป Umami + แสดงผลใน analytics dashboard

(function () {
  'use strict';

  // ── A/B test definitions ──
  // แต่ละ test: { id, name, variants: [{name, weight, applies, override}] }
  // applies: function ที่คืน true ถ้า test นี้ควรรัน
  // override: function ที่รัน variant (e.g. เปลี่ยน CTA text, color)
  const TESTS = [
    {
      id: 'cta_text_v1',
      name: 'CTA Text — "ดูดวงฟรี" vs "เปิดคัมภีร์ชะตา"',
      enabled: true,
      variants: [
        {
          name: 'control',
          weight: 50,
          applies: () => true,
          override: () => {
            // ไม่ทำอะไร — ใช้ default
          },
        },
        {
          name: 'v1',
          weight: 50,
          applies: () => true,
          override: () => {
            // เปลี่ยน CTA text
            const ctas = document.querySelectorAll('[data-ab="primary-cta"], .primary-cta, .btn-primary');
            ctas.forEach((el) => {
              if (el.textContent.includes('ดูดวง') || el.textContent.includes('ทำนาย')) {
                el.textContent = el.textContent.replace(/ดูดวงฟรี|ดูดวงวันนี้|ดูดวง/g, 'เปิดคัมภีร์ชะตา');
              }
            });
          },
        },
      ],
    },
    {
      id: 'premium_price_anchoring',
      name: 'Premium price anchoring — 590 vs 890 crossed out',
      enabled: true,
      variants: [
        {
          name: 'control_590',
          weight: 50,
          applies: () => {
            return document.body.textContent.includes('590');
          },
          override: () => {
            // default
          },
        },
        {
          name: 'v1_890',
          weight: 50,
          applies: () => {
            return document.body.textContent.includes('590');
          },
          override: () => {
            // เปลี่ยน 590 → 890
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (node.nodeValue && node.nodeValue.includes('590')) {
                node.nodeValue = node.nodeValue.replace(/590/g, '890');
              }
            }
          },
        },
      ],
    },
    {
      id: 'hero_color',
      name: 'Hero CTA — gold vs purple gradient',
      enabled: false, // ปิดไว้ก่อน
      variants: [
        { name: 'gold', weight: 50, applies: () => false, override: () => {} },
        { name: 'purple', weight: 50, applies: () => false, override: () => {} },
      ],
    },
  ];

  // ── Assign variant ──
  function assignVariant(test) {
    // ใช้ consistent random based on userId
    let userId;
    try {
      userId = localStorage.getItem('starvia_user_id');
      if (!userId) {
        userId = 'u_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
        localStorage.setItem('starvia_user_id', userId);
      }
    } catch (e) {
      userId = 'anon_' + Math.random().toString(36).slice(2, 8);
    }

    // Hash userId + testId → consistent variant
    const hash = simpleHash(userId + ':' + test.id);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    const target = (hash % 1000) / 1000 * totalWeight;

    let acc = 0;
    for (const variant of test.variants) {
      acc += variant.weight;
      if (target <= acc) {
        return variant;
      }
    }
    return test.variants[0];
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // ── Apply + track ──
  const LS_KEY = 'starvia_ab_assignments';
  let assignments = {};
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) assignments = JSON.parse(saved);
  } catch (e) {}

  function runTests() {
    TESTS.forEach((test) => {
      if (!test.enabled) return;

      // Check if already assigned
      if (assignments[test.id]) {
        const variant = test.variants.find((v) => v.name === assignments[test.id]);
        if (variant && variant.applies()) {
          try { variant.override(); } catch (e) {}
        }
        return;
      }

      // Filter applicable variants
      const applicable = test.variants.filter((v) => {
        try { return v.applies(); } catch (e) { return false; }
      });
      if (applicable.length === 0) return;

      // Assign and apply
      const variant = assignVariant({ ...test, variants: applicable });
      try { variant.override(); } catch (e) {}

      assignments[test.id] = variant.name;
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(assignments));
      } catch (e) {}

      // Track exposure
      if (window.StarviaAnalytics) {
        window.StarviaAnalytics.track('ab_exposed', { test_id: test.id, variant: variant.name });
      }
    });
  }

  // ── Get results ──
  function getAssignments() {
    return Object.assign({}, assignments);
  }

  window.StarviaAB = { runTests, getAssignments, TESTS };

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    // Wait a bit for SPA content
    setTimeout(runTests, 100);
  }
})();
