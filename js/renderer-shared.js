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
  
  TB.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    btn.textContent=tb.lb;
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

    // 💡 กำหนดแท็บที่จะล็อค: 
    // i === 0 คือแท็บแรก (ตัวตนและบุคลิกภาพ) จะปล่อยฟรีเสมอ!
    // i > 0 คือตั้งแต่แท็บที่ 2 เป็นต้นไป (จุดอ่อน, ความรัก, การงาน, อดีตชาติ ฯลฯ) จะถูกล็อค
    var isPremiumTab = false;
    if (i > 0) isPremiumTab = true; 

    // ใส่คลาสเบลอ ถ้าเป็นแท็บพรีเมียมและยังไม่ได้จ่ายเงิน
    if (isPremiumTab && !premiumIsUnlocked()) {
       sec.classList.add('is-locked');
    }

    var html='<div class="orn">✦ · ✦ · ✦</div>';
    tb.secs.forEach(function(s){
      html+='<div class="st">'+s.t+'</div>';
      if(s.c==='habits'){
        p.hb.forEach(function(h,n){ html+='<div class="hi"><div class="hn">'+(n+1)+'</div><div class="ht">'+h+'</div></div>'; });
      } else {
        html+='<div class="rb">'+s.c+'<div class="ref">'+u.rf+' '+s.rf+'</div></div>';
      }
    });

    // วาดกล่องแม่กุญแจทับเนื้อหาที่เบลอไว้
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
  document.getElementById(r).innerHTML='';
  document.getElementById(fc).style.display='block';
  scrollTo({top:0,behavior:'smooth'});
}
