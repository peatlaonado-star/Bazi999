// Shared renderer utilities (buildTabs, resetM)
// Loaded after reading-helpers.js and before individual/couple/auspicious renderers.
function premiumIsUnlocked(){
  return (typeof isPremiumUnlocked === 'function') ? isPremiumUnlocked() : false;
}

function buildPremiumLockOverlay(title, description){
  return '<div class="lock-overlay">'
    + '<div style="font-size:35px; margin-bottom:10px; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));">🔒</div>'
    + '<div style="color:#C9A227; font-size:16px; font-weight:700; margin-bottom:5px;">' + title + '</div>'
    + '<div style="color:#b8a8d8; font-size:13px; margin-bottom:15px; max-width:300px; line-height:1.6;">' + description + '</div>'
    + '<button class="pdf-btn" data-action="open-payment" style="padding:10px 24px; font-size:13px; box-shadow:0 4px 15px rgba(201,162,39,0.3);">ปลดล็อกรีพอร์ตฉบับเต็ม 199 THB</button>'
    + '</div>';
}

function premiumLockedCard(className, teaserHtml, title, description){
  return '<div class="' + className + ' is-locked">'
    + teaserHtml
    + buildPremiumLockOverlay(title || 'เนื้อหาเจาะลึกเฉพาะคุณ (Premium)', description || 'ปลดล็อกรีพอร์ตฉบับเต็มเพื่ออ่านคำวิเคราะห์เชิงลึกและคำแนะนำที่นำไปใช้ได้จริง')
    + '</div>';
}

function buildTabs(tid,sid,pre,TB,p,u){
  var tt=document.getElementById(tid), ts2=document.getElementById(sid);
  // Icon map for each tab position
  var tabIcons = ['👤', '💞', '💼', '💰'];
  
  TB.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    var lockSpan = '<span class="tab-lock">🔒</span>';
    btn.innerHTML = '<span class="tab-icon">' + (tabIcons[i] || '✦') + '</span><span class="tab-text">' + tb.lb + '</span>' + lockSpan;
    btn.addEventListener('click', function(){
      document.querySelectorAll('#'+tid+' .tab').forEach(function(t){t.classList.remove('on');});
      document.querySelectorAll('#'+sid+' .sec').forEach(function(s){s.classList.remove('on');});
      btn.classList.add('on');
      document.getElementById(pre+i).classList.add('on');
    });
    tt.appendChild(btn);
    
    var sec=document.createElement('div');
    sec.className='sec'+(i===0?' on':'');
    sec.id=pre+i;

    var isPremiumTab = true;
    if (isPremiumTab && !premiumIsUnlocked()) {
       sec.classList.add('is-locked');
    }

    var html='';
    tb.secs.forEach(function(s){
      html += '<div class="tab-section-card">'
        + '<div class="tsc-header"><span class="tsc-icon">✦</span><span class="tsc-title">' + s.t + '</span></div>'
        + '<div class="tsc-body">';
      if(s.c==='habits'){
        p.hb.forEach(function(h,n){ html+='<div class="hi"><div class="hn">'+(n+1)+'</div><div class="ht">'+h+'</div></div>'; });
      } else {
        html += '<div class="rb">'+s.c+'</div>';
      }
      html += '<div class="tsc-ref"><span class="tsc-ref-dot">🔍</span>' + u.rf + ' ' + s.rf + '</div>'
        + '</div></div>';
    });

    if (isPremiumTab && !premiumIsUnlocked()) {
        html += buildPremiumLockOverlay(
          'เนื้อหาเจาะลึกเฉพาะคุณ (Premium)',
          'ปลดล็อกเพื่ออ่านกระจกกรรม วิเคราะห์ 6 ด้าน อดีต-ปัจจุบัน-อนาคต และคำแนะนำที่นำไปใช้ได้จริง'
        );
    }

    sec.innerHTML=html;
    ts2.appendChild(sec);
  });
}

function resetM(mode){
  var fc=['fc0','fc1','fc2'][mode], r=['r0','r1','r2'][mode];
  if (document.body && document.body.classList) document.body.classList.remove('has-report');
  document.getElementById(r).innerHTML='';
  document.getElementById(fc).style.display='block';
  scrollTo({top:0,behavior:'smooth'});
}

// ═══ Lottery Results Card ═══
function loadLotteryResults(){
  var section = document.getElementById('lottery-results-section');
  if(!section) return;
  section.innerHTML = '<div class="lottery-loading">🎰 กำลังโหลดผลสลาก...</div>';
  var apiBase = (window.STARVIA_CONFIG && window.STARVIA_CONFIG.apiBaseUrl) || '/v1';
  fetch(apiBase + '/lottery/results')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data || !data.available || !data.firstPrize){
        var now = new Date(), day = now.getDate(), h = now.getHours();
        if((day === 1 || day === 16) && h >= 16){
          section.innerHTML = '<div class="lottery-waiting">'
            + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
            + '<p style="text-align:center;color:var(--tx2);font-size:13px;padding:14px;">⏳ กำลังรอผลการออกรางวัล... ระบบจะอัปเดตให้อัตโนมัติ</p></div>';
          setTimeout(loadLotteryResults, 30000);
        } else {
          section.innerHTML = '<div class="lottery-empty">'
            + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
            + '<p style="text-align:center;color:var(--tx2);font-size:13px;padding:14px;">ยังไม่มีผลหวยงวดล่าสุด — รออัปเดตเมื่อมีการออกรางวัล</p></div>';
        }
        return;
      }
      var dd = data.displayDate || {};
      var yr = dd.year ? (parseInt(dd.year,10)+543) : '';
      var dateStr = (dd.date||'')+'/'+(dd.month||'')+'/'+yr;
      var html = '<div class="lottery-card">'
        + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
        + '<div class="lottery-date">งวดวันที่ ' + dateStr + '</div>'
        + '<div class="lottery-prize first-prize">'
        + '<div class="lp-label">รางวัลที่ 1</div>'
        + '<div class="lp-number">' + data.firstPrize + '</div>'
        + '<div class="lp-amount">6,000,000 บาท</div></div>'
        + '<div class="lottery-grid">'
        + '<div class="lottery-sub"><span class="ls-label">เลขหน้า 3 ตัว</span><span class="ls-nums">' + (data.last3f||[]).join(' · ') + '</span></div>'
        + '<div class="lottery-sub"><span class="ls-label">เลขท้าย 3 ตัว</span><span class="ls-nums">' + (data.last3b||[]).join(' · ') + '</span></div>'
        + '<div class="lottery-sub"><span class="ls-label">เลขท้าย 2 ตัว</span><span class="ls-nums">' + (data.last2||[]).join(' · ') + '</span></div></div>'
        + '<div class="lottery-note">ข้อมูลจากสำนักงานสลากกินแบ่งรัฐบาล</div></div>';
      section.innerHTML = html;
    })
    .catch(function(){ section.innerHTML = ''; });
}

// Auto-load after report renders
(function(){
  var _origRenderInd = window.renderInd;
  if(typeof renderInd === 'function'){
    renderInd = function(){
      _origRenderInd.apply(this, arguments);
      setTimeout(loadLotteryResults, 600);
    };
  }
})();
