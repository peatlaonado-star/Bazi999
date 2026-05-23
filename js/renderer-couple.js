// Couple reading renderer (Mode 1)
// Provides: renderCouple, go1
// ===== MODE 1: Couple =====
function go1(){
  var da=document.getElementById('d1a').value, db=document.getElementById('d1b').value;
  if(!da||!db)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var def=u.def||['คนที่หนึ่ง','คนที่สอง'];
  var na=document.getElementById('n1a').value||def[0];
  var nb=document.getElementById('n1b').value||def[1];
  var ta=document.getElementById('t1a').value||'06:00';
  var tb=document.getElementById('t1b').value||'06:00';
  var pa=PL2[new Date(da).getDay()], pb=PL2[new Date(db).getDay()];
  var ria=getRasi(da), rib=getRasi(db);
  var lia=getLagna(da,ta), lib=getLagna(db,tb);
  document.getElementById('fc1').style.display='none';
  showLoad();
  setTimeout(function(){
    hideLoad();
    renderCouple(na,pa,RA2[ria],RA2[lia],ria,lia,nb,pb,RA2[rib],RA2[lib],rib,lib,u,RA2);
  },900);
}

function renderCouple(na,pa,ra,la,ria,lia,nb,pb,rb,lb2,rib,lib,u,RA2){
  var wrap=document.getElementById('r1');
  na = escapeHTML(na);
  nb = escapeHTML(nb);
  var premiumUnlocked = premiumIsUnlocked();
  var elS=ELC[pa.ei][pb.ei];
  var piA=getPL().indexOf(pa), piB=getPL().indexOf(pb);
  var plS=PLC[piA>=0?piA:0][piB>=0?piB:0];
  var ang=rasiAngle(ria,rib), angS=ang[0], angD=ang[1];
  var lgS=ELC[RA2[lia].el][RA2[lib].el];
  
  // คำนวณคะแนนความเข้ากันได้
  var total=Math.round(elS*.3+plS*.3+angS*.25+lgS*.15);
  var ELD=getELD();
  var elDesc=ELD[pa.ei][pb.ei];

  // ระบบตัดเกรด (S, A, B, C, D)
  var gradeLtr = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
  var gradeLbl = total >= 90 ? 'Soulmate Energy (คู่แท้ส่งเสริมกัน)' : 
                 total >= 80 ? 'Harmonious Pair (คู่ที่เข้ากันได้ดีเยี่ยม)' : 
                 total >= 70 ? 'Growing Together (คู่ที่ต้องเรียนรู้และเติบโต)' : 
                 total >= 60 ? 'Understanding Needed (คู่ที่ต้องใช้ความเข้าใจสูง)' : 
                               'Karmic Lesson (คู่เวรคู่กรรม/บทเรียนสำคัญ)';

  var dharma = getCoupleDharmaType(total, elS, pa.ei === pb.ei);
  var dharmaTeaser = '<div class="dharma-kicker">Couple Dharma Map</div>'
    + '<div class="dharma-label">' + escapeHTML(dharma.label) + '</div>'
    + '<div class="dharma-title">' + escapeHTML(dharma.title) + '</div>'
    + '<div class="dharma-intro">ปลดล็อกเพื่ออ่านบทเรียนร่วมกัน วิธีดูแลความสัมพันธ์ และแผนที่ความสัมพันธ์ฉบับเต็ม</div>';
  var dharmaFull = '<div class="dharma-card">'
    + '<div class="dharma-kicker">Couple Dharma Map</div>'
    + '<div class="dharma-label">' + escapeHTML(dharma.label) + '</div>'
    + '<div class="dharma-title">' + escapeHTML(dharma.title) + '</div>'
    + '<div class="dharma-intro">' + escapeHTML(dharma.intro) + '</div>'
    + '<div class="dharma-grid">'
    + '<div><strong>สิ่งที่คู่นี้มาเรียนรู้ร่วมกัน</strong><br>' + escapeHTML(dharma.meaning) + '</div>'
    + '<div><strong>วิธีดูแลความสัมพันธ์</strong><br>' + escapeHTML(dharma.advice) + '</div>'
    + '</div>'
    + '</div>';
  var dharmaHtml = premiumUnlocked ? dharmaFull : premiumLockedCard(
    'dharma-card',
    dharmaTeaser,
    'ปลดล็อก Couple Dharma Map',
    'ดูบทเรียนความสัมพันธ์ คะแนนย่อย 4 ด้าน และแผนดูแลความรักแบบเต็ม'
  );

  // สร้าง Viral Matrix Card
  var matrixHtml = '<div class="matrix-card">'
    + '<div class="mx-names">'
    + '<div class="mx-person"><div class="mx-n">' + na + '</div><div class="mx-p">' + pa.s + ' ' + pa.n + ' · ธาตุ' + pa.el + '</div></div>'
    + '<div class="mx-heart">♡</div>'
    + '<div class="mx-person"><div class="mx-n">' + nb + '</div><div class="mx-p">' + pb.s + ' ' + pb.n + ' · ธาตุ' + pb.el + '</div></div>'
    + '</div>'
    
    + '<div class="mx-score-wrap">'
    + '<div class="mx-title">The Compatibility Matrix</div>'
    + '<div class="mx-score">' + total + '% <span class="mx-grade">' + gradeLtr + '</span></div>'
    + '<div class="mx-lbl">' + gradeLbl + '</div>'
    + '<div class="mx-lbl dharma-chip">' + escapeHTML(dharma.label) + '</div>'
    + '</div>'

    + '<div class="chem-box">'
    + '<div class="chem-title"><span style="font-size:14px">⚗️</span> ปฏิกิริยาเคมีธาตุ (Element Chemistry)</div>'
    + '<div class="chem-desc">' + elDesc + '</div>'
    + '</div>' // ปิด chem-box
    + '</div>' // ปิด matrix-card
    // ปุ่มเซฟรูปภาพถูกเอาออกตามคำขอผู้ใช้

  var scoreBreakdownHtml = '<div class="cg2' + (premiumUnlocked ? '' : ' is-locked') + '">'
    +'<div class="ci2"><div class="ci2l">'+u.ec+'</div><div class="ci2s">'+pa.el+' + '+pb.el+'</div><div class="ci2v">'+elS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.pc+'</div><div class="ci2s">'+pa.s+' + '+pb.s+'</div><div class="ci2v">'+plS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.rc+'</div><div class="ci2s">'+ra.s+' + '+rb.s+'</div><div class="ci2v">'+angS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.lc+'</div><div class="ci2s">'+RA2[lia].s+' + '+RA2[lib].s+'</div><div class="ci2v">'+lgS+'%</div></div>'
    + (premiumUnlocked ? '' : buildPremiumLockOverlay('ปลดล็อกคะแนนย่อย 4 ด้าน', 'ดูเคมีธาตุ ดาวคู่ ราศีคู่ และลัคนาคู่ พร้อมคำอธิบายเต็ม'))
    +'</div>';

  wrap.innerHTML = matrixHtml
    + dharmaHtml
    + scoreBreakdownHtml
    +'<div class="tabs-w"><div class="tabs" id="tt1"></div></div><div id="ts1"></div>';

  // สร้าง Action Plan สำหรับคู่รัก
  var strG = elS>=80 ? 'ธาตุ'+pa.el+'และ'+pb.el+'ที่ส่งเสริมกันอย่างเป็นธรรมชาติ' : 'ความแตกต่างของธาตุที่ทำให้อีกฝ่ายได้เห็นมุมมองใหม่';
  var strW = pa.ei===pb.ei ? 'การสะท้อนจุดอ่อนของกันและกันจนขยายใหญ่ขึ้น' : 'การตีความความแตกต่างว่าเป็นความขัดแย้งแทนที่จะมองว่าเป็นการเติมเต็ม';
  
  var actionPlanHtml = '<div class="action-plan-card" style="margin-top:0;">'
    + '<div class="ap-title">✦ พิมพ์เขียวความสัมพันธ์ ✦</div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4>จุดแข็งที่ต้องรักษา</h4><p>ความสัมพันธ์นี้มีจุดเด่นเรื่อง <strong>' + strG + '</strong> จงใช้สิ่งนี้เป็นกาวใจในวันที่ทะเลาะกัน</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4>หลุมพรางที่ต้องระวัง</h4><p>สิ่งที่ดาวเตือนคือ <strong>' + strW + '</strong> เมื่อเกิดปัญหานี้ ให้หยุดพัก 15 นาทีก่อนคุยต่อเพื่อลดการใช้อารมณ์</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4>คำแนะนำจากดวงดาว</h4><p>ความสัมพันธ์ที่ยั่งยืนไม่ได้เกิดจากดวงที่สมบูรณ์แบบ แต่เกิดจากคนสองคนที่ไม่ยอมแพ้ต่อกัน หมั่นสื่อสารความต้องการอย่างตรงไปตรงมาและให้เกียรติกันเสมอ</p></div></div>'
    + '</div>';
  var visibleActionPlanHtml = premiumUnlocked ? actionPlanHtml : premiumLockedCard(
    'action-plan-card',
    '<div class="ap-title">✦ แผนความสัมพันธ์ Premium ✦</div><p style="text-align:center;color:var(--tx2);line-height:1.7;">ปลดล็อกเพื่อดูจุดแข็ง หลุมพราง และคำแนะนำเฉพาะคู่</p>',
    'ปลดล็อกแผนความสัมพันธ์',
    'อ่านแผน 3 ขั้นสำหรับรักษาจุดแข็ง ระวังหลุมพราง และสื่อสารให้ดีขึ้น'
  );
  wrap.insertAdjacentHTML('beforeend', visibleActionPlanHtml);

  var CT=[
    {lb:u.ct[0], secs:[{t:'ผลวิเคราะห์เคมีคู่รัก', c:(premiumUnlocked ? actionPlanHtml : '<p>ปลดล็อก Premium เพื่ออ่านแผนความสัมพันธ์ฉบับเต็ม</p>'), rf:'หลักดวงสมพงศ์ (Synastry) ผสมผสานหลักจิตวิทยาความสัมพันธ์'}]},
    {lb:u.ct[1], secs:[{t:u.cs[1], c:elDesc, rf:'Four Elements | '+pa.el+' + '+pb.el+' | Score: '+elS+'%'}]},
    {lb:u.ct[2], secs:[{t:u.cs[2], c:ra.n+' meets '+rb.n+' — '+angD, rf:'Sign synastry | '+ra.n+' + '+rb.n+' | Score: '+angS+'%'}]},
    {lb:u.ct[3], secs:[{t:u.cs[3], c:'ลัคนาของ'+na+'ตกในราศี'+RA2[lia].n+' — '+RA2[lia].add+'<br><br>ลัคนาของ'+nb+'ตกในราศี'+RA2[lib].n+' — '+RA2[lib].add, rf:'Lagna '+RA2[lia].n+' + '+RA2[lib].n+' | Score: '+lgS+'%'}]}
  ];

  var tt=document.getElementById('tt1'), ts2=document.getElementById('ts1');
  CT.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    btn.textContent=tb.lb;
    btn.addEventListener('click', function(){
      document.querySelectorAll('#tt1 .tab').forEach(function(t){t.classList.remove('on');});
      document.querySelectorAll('#ts1 .sec').forEach(function(s){s.classList.remove('on');});
      btn.classList.add('on');
      document.getElementById('c1_'+i).classList.add('on');
    });
    tt.appendChild(btn);
    var sec=document.createElement('div');
    sec.className='sec'+(i===0?' on':'');
    sec.id='c1_'+i;
    var html='<div class="orn">✦ · ✦ · ✦</div>';
    tb.secs.forEach(function(s){
      html+='<div class="st">'+s.t+'</div><div class="rb" style="background:transparent; border:none; padding:0;">'+s.c+'<div class="ref" style="margin-top:15px;">'+u.rf+' '+s.rf+'</div></div>';
    });
    sec.innerHTML=html;
    ts2.appendChild(sec);
  });
  
  ts2.insertAdjacentHTML('beforeend',
    '<div class="mc" style="margin-top:20px;"><div class="mc-l">✦ '+u.cm+' ✦</div>'
    +'<div class="mc-t">"'+u.cv2+'"</div></div>'
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="1">'+u.r1+'</button></div>'
  );
}
