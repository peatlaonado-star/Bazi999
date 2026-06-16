// STARVIA Floating Table of Contents + Progress Bar
// Shows current section and allows quick navigation
(function() {
  'use strict';

  var TOC_SECTIONS = [
    { id: 'blueprint', label: 'พิมพ์เขียว', icon: '🔮' },
    { id: 'daily-power', label: 'กำลังวัน', icon: '✦' },
    { id: 'enhancement', label: 'เสริมดวง', icon: '✨' },
    { id: 'windfall', label: 'ลาภลอย', icon: '🎲' },
    { id: 'domain', label: 'คัมภีร์', icon: '🎯' },
    { id: 'life-graph', label: 'พิมพ์เขียวชีวิต', icon: '📊' },
    { id: 'compatibility', label: 'ตารางธาตุ', icon: '💘' },
    { id: 'trends', label: 'แนวโน้ม', icon: '🌑' },
    { id: 'planetary', label: 'ดาวเดือนเกิด', icon: '🪐' },
    { id: 'detail-tabs', label: 'รายละเอียด', icon: '📋' }
  ];

  function buildToc() {
    // Don't build on small screens
    if (window.innerWidth < 768) return;

    var wrap = document.getElementById('reportWrap') || document.querySelector('.mode.on');
    if (!wrap) return;

    // Add data-section attributes to existing collapsibles
    var labels = wrap.querySelectorAll('.section-toggle-label');
    labels.forEach(function(label) {
      var text = label.textContent || '';
      var match = TOC_SECTIONS.find(function(s) {
        return text.includes(s.label);
      });
      if (match) {
        var toggle = label.closest('.section-toggle') || label.parentElement;
        if (toggle) toggle.setAttribute('data-section', match.id);
      }
    });

    // Also tag blueprint hero
    var blueprint = wrap.querySelector('.blueprint-card');
    if (blueprint) blueprint.setAttribute('data-section', 'blueprint');

    // Build ToC UI
    var tocHtml = '<nav class="floating-toc" aria-label="สารบัญรายงาน">'
      + '<div class="toc-progress"><div class="toc-progress-bar"></div></div>'
      + '<ul class="toc-list">';

    TOC_SECTIONS.forEach(function(s) {
      tocHtml += '<li class="toc-item" data-target="' + s.id + '">'
        + '<span class="toc-icon">' + s.icon + '</span>'
        + '<span class="toc-label">' + s.label + '</span>'
        + '</li>';
    });

    tocHtml += '</ul></nav>';

    var tocEl = document.createElement('div');
    tocEl.innerHTML = tocHtml;
    document.body.appendChild(tocEl.firstChild);

    // Click handlers
    document.querySelectorAll('.toc-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var target = item.getAttribute('data-target');
        var targetEl;
        if (target === 'blueprint') {
          targetEl = wrap.querySelector('.blueprint-card');
        } else {
          targetEl = wrap.querySelector('[data-section="' + target + '"]');
        }
        if (targetEl) {
          var offset = targetEl.offsetTop - 60;
          window.scrollTo({ top: offset, behavior: 'smooth' });
          // Open if collapsed
          if (targetEl.classList.contains('collapsible-section') && !targetEl.classList.contains('open')) {
            var toggle = targetEl.querySelector('.collapsible-toggle');
            if (toggle) toggle.click();
          }
        }
      });
    });

    // Scroll handler for active state + progress
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
  }

  function updateActiveSection() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;

    var bar = document.querySelector('.toc-progress-bar');
    if (bar) bar.style.width = progress + '%';

    // Active section
    var items = document.querySelectorAll('.toc-item');
    var activeFound = false;
    TOC_SECTIONS.forEach(function(s) {
      var targetEl;
      if (s.id === 'blueprint') {
        targetEl = document.querySelector('.blueprint-card');
      } else {
        targetEl = document.querySelector('[data-section="' + s.id + '"]');
      }
      if (!targetEl) return;

      var rect = targetEl.getBoundingClientRect();
      var item = document.querySelector('.toc-item[data-target="' + s.id + '"]');
      if (!item) return;

      if (rect.top <= 100 && rect.bottom > 100) {
        items.forEach(function(i) { i.classList.remove('active'); });
        item.classList.add('active');
        activeFound = true;
      }
    });

    if (!activeFound && scrollTop < 100) {
      items.forEach(function(i) { i.classList.remove('active'); });
      var first = document.querySelector('.toc-item');
      if (first) first.classList.add('active');
    }
  }

  // Expose globally
  window.STARVIA_TOC = { build: buildToc };

  // Build on report render
  document.addEventListener('starvia:reportRendered', buildToc);

  // Fallback: watch for report wrap
  var observer = new MutationObserver(function() {
    var wrap = document.getElementById('reportWrap');
    if (wrap && wrap.children.length > 0) {
      setTimeout(buildToc, 100);
      observer.disconnect();
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
