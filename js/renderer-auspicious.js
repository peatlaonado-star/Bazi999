// Auspicious reading renderer (Mode 2)
// Provides: renderAusp, go2
// ===== MODE 2: Auspicious =====
function go2(){
  var ds=document.getElementById('d2').value; if(!ds)return;
  var u=U(), PL2=getPL();
  var nm=document.getElementById('n2').value||(u.pdef||'บุคคลนี้');
  var pw=new Date(ds).getDay(), p=PL2[pw];
  document.getElementById('fc2').style.display='none';
  showLoad();
  setTimeout(function(){ hideLoad(); renderAusp(nm,p,pw,u); }, 700);
}

function renderAusp(nm,p,pw,u){
  var wrap=document.getElementById('r2');
  nm = escapeHTML(nm);
  // Personal header card
  var elementEmoji = p.el === 'ไฟ' ? '🔥' : p.el === 'ดิน' ? '🪨' : p.el === 'ลม' ? '💨' : '💧';
  var connectionMsg = 'พลังงานจากดาว' + p.n + ' (' + p.el + ') เสริมจังหวะชีวิตของคุณ';
  var auspHeaderHtml = '<div class="ausp-header-card">'
    + '<div class="ahp-planet" style="color:' + p.c + '">' + p.s + '</div>'
    + '<div class="ahp-info">'
    + '<div class="ahp-name">' + nm + ' — ธาตุ' + p.el + ' ' + elementEmoji + '</div>'
    + '<div class="ahp-connection">' + connectionMsg + '</div>'
    + '</div></div>';
  var DN=u.dn;
  var DS=['☉','☽','♂','☿','♃','♀','♄'];
  var DC=['#FFB84D','#C8DCF0','#E8534A','#6EC89A','#F5A623','#E8A0CF','#9B8AB8'];

  // 1. ระบบดึงสีมงคลตาม "วันปัจจุบันอัตโนมัติ" (ให้คนเปิดแอปทุกเช้า)
  var TODAY_COLORS = [
    { d: 'อาทิตย์', luck: '#4CAF50', luckN: 'เขียว (รับทรัพย์)', work: '#9C27B0', workN: 'ม่วง (ผู้ใหญ่เอ็นดู)', bad: '#2196F3', badN: 'ฟ้า/น้ำเงิน (เลี่ยง)' }, // 0
    { d: 'จันทร์', luck: '#9C27B0', luckN: 'ม่วง (รับทรัพย์)', work: '#FF9800', workN: 'ส้ม (ผู้ใหญ่เอ็นดู)', bad: '#F44336', badN: 'แดง (เลี่ยง)' }, // 1
    { d: 'อังคาร', luck: '#FF9800', luckN: 'ส้ม (รับทรัพย์)', work: '#424242', workN: 'เทา/ดำ (ผู้ใหญ่เอ็นดู)', bad: '#FFFFFF', badN: 'ขาว/เหลือง (เลี่ยง)' }, // 2
    { d: 'พุธ', luck: '#424242', luckN: 'เทา/ดำ (รับทรัพย์)', work: '#2196F3', workN: 'ฟ้า/น้ำเงิน (ผู้ใหญ่เอ็นดู)', bad: '#E91E63', badN: 'ชมพู (เลี่ยง)' }, // 3
    { d: 'พฤหัสบดี', luck: '#F44336', luckN: 'แดง (รับทรัพย์)', work: '#FFFFFF', workN: 'ขาว/ครีม (ผู้ใหญ่เอ็นดู)', bad: '#9C27B0', badN: 'ม่วง (เลี่ยง)' }, // 4
    { d: 'ศุกร์', luck: '#E91E63', luckN: 'ชมพู (รับทรัพย์)', work: '#4CAF50', workN: 'เขียว (ผู้ใหญ่เอ็นดู)', bad: '#424242', badN: 'เทา/ดำ (เลี่ยง)' }, // 5
    { d: 'เสาร์', luck: '#2196F3', luckN: 'ฟ้า/น้ำเงิน (รับทรัพย์)', work: '#F44336', workN: 'แดง (ผู้ใหญ่เอ็นดู)', bad: '#4CAF50', badN: 'เขียว (เลี่ยง)' } // 6
  ];
  var todayIdx = new Date().getDay(); // ดึงวันปัจจุบันจากเครื่องผู้ใช้
  var tc = TODAY_COLORS[todayIdx];

  var colorHtml = '<div class="wellness-card">'
    + '<div class="wc-title"><span style="font-size:16px;">✨</span> พลังงานสีประจำวันนี้ (วัน'+tc.d+')</div>'
    + '<div class="color-day">'
    + '<div class="cd-row">'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.luck+';"></div><div class="cd-lbl" style="color:var(--g);">'+tc.luckN+'</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.work+';"></div><div class="cd-lbl" style="color:var(--g);">'+tc.workN+'</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.bad+'; border-color:rgba(255,0,0,0.4);"></div><div class="cd-lbl" style="color:#c06080">'+tc.badN+'</div></div>'
    + '</div>'
    + '<div style="font-size:10px; color:var(--tx2); margin-top:16px; text-align:center;">*ระบบอัปเดตอัตโนมัติตามวันปัจจุบัน เพื่อให้คุณจัดเตรียมเสื้อผ้าหรือสิ่งของเครื่องใช้ในทุกๆ เช้า</div>'
    + '</div>'
    + '</div>';

  // 2. Cosmic Routine (ตารางนาฬิกาชีวิตตามธาตุเกิดของเจ้าชะตา)
  var routines = {
    'ไฟ': [
      { t: '06:00 - 08:00', d: '<strong>Ignite (ปลุกพลัง):</strong> ออกกำลังกายเรียกเหงื่อ หรือตั้งเป้าหมาย 3 อย่างที่ต้องทำให้สำเร็จในวันนี้' },
      { t: '09:00 - 14:00', d: '<strong>Blaze (ลุยงาน):</strong> ช่วงพลังสูงสุด! จัดการงานที่ยากที่สุดหรือต้องใช้ความกล้าหาญ' },
      { t: '15:00 - 17:00', d: '<strong>Radiate (กระจายแสง):</strong> ประชุมทีม สื่อสารสร้างเครือข่าย หรือให้ความช่วยเหลือคนรอบข้าง' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Ember (พักฟื้น):</strong> ลดการใช้หน้าจอ อาบน้ำอุ่น ปล่อยให้ความใจร้อนและอีโก้ค่อยๆ สงบลง' }
    ],
    'ดิน': [
      { t: '06:00 - 08:00', d: '<strong>Ground (ตั้งหลัก):</strong> ยืดเหยียดร่างกาย ดื่มน้ำเปล่า รดน้ำต้นไม้ และจัดลำดับงานอย่างช้าๆ' },
      { t: '09:00 - 15:00', d: '<strong>Build (สร้างสรรค์):</strong> ช่วง Deep Work ทำงานที่ต้องใช้สมาธิและความละเอียดรอบคอบสูง' },
      { t: '16:00 - 18:00', d: '<strong>Organize (จัดระเบียบ):</strong> สะสางอีเมล จัดโต๊ะทำงาน หรือวางแผนการเงิน/งานสำหรับวันพรุ่งนี้' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Settle (สงบใจ):</strong> ทานอาหารมื้ออร่อย อยู่กับคนที่รัก และคลายกล้ามเนื้อที่ตึงเครียด' }
    ],
    'ลม': [
      { t: '06:00 - 08:00', d: '<strong>Breathe (เปิดรับ):</strong> อ่านบทความ ฟังพอดแคสต์ หรือเขียน Journal เพื่อระบายความคิดที่วิ่งวน' },
      { t: '09:00 - 12:00', d: '<strong>Flow (ลื่นไหล):</strong> ระดมสมอง (Brainstorm) คิดงานครีเอทีฟ หรือเริ่มต้นเรียนรู้สิ่งใหม่ๆ' },
      { t: '13:00 - 16:00', d: '<strong>Connect (เชื่อมโยง):</strong> นัดหมายลูกค้า นำเสนองาน หรือพูดคุยแลกเปลี่ยนไอเดียกับผู้คน' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Still (หยุดนิ่ง):</strong> งดรับข้อมูลข่าวสาร ฝึกทำสมาธิ หรือทำกิจกรรมที่ต้องโฟกัสสิ่งเดียว' }
    ],
    'น้ำ': [
      { t: '06:00 - 08:00', d: '<strong>Reflect (สะท้อนใจ):</strong> นั่งสมาธิ ฟังเพลงบรรเลง และเช็กความรู้สึกของตัวเองก่อนเริ่มวันใหม่' },
      { t: '09:00 - 12:00', d: '<strong>Nurture (ดูแล):</strong> ทำงานที่ต้องใช้ความเห็นอกเห็นใจ ดูแลลูกค้า หรือประสานงานซัพพอร์ตทีม' },
      { t: '13:00 - 16:00', d: '<strong>Create (สร้างผลงาน):</strong> ใช้สัญชาตญาณและอารมณ์ศิลป์ในการสร้างสรรค์ผลงานหรือแก้ปัญหา' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Cleanse (ชำระล้าง):</strong> แช่น้ำอุ่น เขียนบันทึกขอบคุณ ปล่อยวางความรู้สึกของผู้อื่นที่แบกรับมาทั้งวัน' }
    ]
  };
  var myRoutine = routines[p.el];
  var routineHtml = '<div class="wellness-card">'
    + '<div class="wc-title"><span style="font-size:16px;">⏳</span> นาฬิกาชีวิตธาตุ'+p.el+' (Cosmic Routine)</div>'
    + '<div style="font-size:11.5px; color:var(--tx2); margin-bottom:16px; text-align:center; line-height:1.6;">ตารางเวลาที่สอดคล้องกับพลังงานดวงดาวของคุณ ปรับใช้เพื่อดึงศักยภาพออกมาได้สูงสุดและลดความเหนื่อยล้า</div>';
  myRoutine.forEach(function(rt){
    routineHtml += '<div class="time-block"><div class="tb-time">'+rt.t+'</div><div class="tb-desc">'+rt.d+'</div></div>';
  });
  routineHtml += '</div>';

  // 3. ปฏิทินวันมงคล (Auspicious Days)
  var dg='<div class="dg">';
  for(var i=0;i<7;i++){
    var sc=PLC[pw][i], lv=sc>=85?'good':sc>=70?'mid':'bad';
    var lt=lv==='good'?u.dg:lv==='mid'?u.dm:u.db2;
    var lc=lv==='good'?'g':lv==='mid'?'m':'b';
    dg+='<div class="di '+lv+'"><div class="dn2">'+DN[i]+'</div><div class="dsym" style="color:'+DC[i]+'">'+DS[i]+'</div><div class="dlv '+lc+'">'+lt+'</div></div>';
  }
  dg+='</div>';

  var ACTS_TH=[['เริ่มโปรเจกต์ใหม่',pw,(pw+4)%7],['เจรจา/เซ็นสัญญา',3,4],['พบผู้ใหญ่/นำเสนองาน',4,0],['การเงิน/ลงทุน',5,4],['ความรัก/ออกเดต',5,1]];
  var ACTIVITY_TIMES = {
    'ไฟ': ['06:00–08:00', '09:00–14:00', '09:00–14:00', '09:00–14:00', '06:00–08:00'],
    'ดิน': ['09:00–15:00', '09:00–15:00', '09:00–15:00', '16:00–18:00', '09:00–15:00'],
    'ลม': ['09:00–12:00', '13:00–16:00', '13:00–16:00', '09:00–12:00', '13:00–16:00'],
    'น้ำ': ['09:00–12:00', '09:00–12:00', '13:00–16:00', '09:00–12:00', '13:00–16:00']
  };
  var actTimes = ACTIVITY_TIMES[p.el] || ACTIVITY_TIMES['ไฟ'];
  var ah='';
  ACTS_TH.forEach(function(a, aIdx){
    ah+='<div class="hi"><div class="hn" style="width:auto;border-radius:7px;padding:0 8px;font-size:10px">'+a[0]+'</div>'
      +'<div class="ht" style="font-size:12px;">'+u.ab+' <strong style="color:#C9A227">'+u.ad+DN[a[1]]+'</strong> <span style="font-size:10px;color:var(--tx2);">(รองลงมา: '+u.ad+DN[a[2]]+')</span>'
      +'<span class="act-time-window">⏰ '+actTimes[aIdx]+'</span></div></div>';
  });

  // รวบรวมข้อมูลทั้งหมดแสดงผล
  wrap.innerHTML=
    auspHeaderHtml
    +'<div class="brow"><span style="font-size:15px;color:'+p.c+'">'+p.s+'</span>'
    +'<span style="font-size:11px;color:#c8b87a"><strong style="color:#C9A227">'+nm+'</strong>'
    +' · <strong style="color:#C9A227">'+p.n+'</strong> · ตารางชีวิตประจำวัน</span></div>'
    
    + colorHtml 
    + routineHtml

    +'<div class="card" style="padding:18px;margin-bottom:13px">'
    +'<div class="st">ปฏิทินวันมงคลส่วนตัว (Auspicious Days)</div>'+dg
    +'<div class="ref" style="margin-bottom:18px;">'+u.rf+' วันที่พลังงานดาวบนท้องฟ้าส่งเสริมดวงชะตาของคุณ</div>'
    + ah
    +'</div>'

    +'<div class="mc"><div class="mc-l">✦ '+u.am+' ✦</div><div class="mc-t" style="font-size:13.5px; line-height:1.9; font-weight:normal;">"เวลาที่ดีที่สุดคือเวลาที่คุณพร้อมที่สุด ดาวเป็นเพียงแสงนำทาง แต่จังหวะก้าวเดินเป็นของคุณ"</div></div>'
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="2">'+u.r2+'</button></div>';
}

// Max date
['d0','d1a','d1b','d2'].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.max=new Date().toISOString().split('T')[0];
});
