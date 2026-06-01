// Couple reading renderer (Mode 1)
// Provides: renderCouple, go1
// ===== MODE 1: Couple =====
function go1(){
  var da=document.getElementById('d1a').value, db=document.getElementById('d1b').value;
  if(!da)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var def=u.def||['คนที่หนึ่ง','คนที่สอง'];
  var na=document.getElementById('n1a').value||def[0];
  var ta=document.getElementById('t1a').value||'06:00';
  var pa=PL2[new Date(da).getDay()];
  var ria=getRasi(da);
  var lia=getLagna(da,ta);
  document.getElementById('fc1').style.display='none';
  showLoad();
  setTimeout(function(){
    hideLoad();
    if(!db){
      renderSingleLoveOpportunity(na,pa,RA2[ria],RA2[lia],ria,lia,u,RA2,da);
      return;
    }
    var nb=document.getElementById('n1b').value||def[1];
    var tb=document.getElementById('t1b').value||'06:00';
    var pb=PL2[new Date(db).getDay()];
    var rib=getRasi(db), lib=getLagna(db,tb);
    renderCouple(na,pa,RA2[ria],RA2[lia],ria,lia,nb,pb,RA2[rib],RA2[lib],rib,lib,u,RA2,da,db);
  },900);
}

function parseBirthDateSafe(value){
  if(!value) return null;
  var d = new Date(value + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function getAgeFromBirthDate(value){
  var d = parseBirthDateSafe(value);
  if(!d) return null;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var hadBirthday = today.getMonth() > d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  return hadBirthday ? age : age - 1;
}

function loveDigitFromDate(value){
  var d = parseBirthDateSafe(value);
  if(!d) return 6;
  var raw = String(d.getFullYear()) + String(d.getMonth()+1) + String(d.getDate());
  var sum = raw.split('').reduce(function(acc,ch){ return acc + (parseInt(ch,10)||0); },0);
  while(sum > 9) sum = String(sum).split('').reduce(function(acc,ch){ return acc + (parseInt(ch,10)||0); },0);
  return sum || 6;
}

function loveWindowForPerson(dateValue, planetIndex, rasiIndex, offset){
  var age = getAgeFromBirthDate(dateValue);
  var digit = loveDigitFromDate(dateValue);
  var base = 18 + ((digit * 3 + planetIndex * 2 + rasiIndex + offset) % 16);
  var target = base;
  var safety = 0;
  while(age !== null && target < age - 1 && safety < 8){
    target += 7;
    safety++;
  }
  return {
    age: age,
    start: target,
    end: target + 2,
    label: target + '–' + (target + 2) + ' ปี'
  };
}

function buildLoveDestinyModel(dateA,dateB,total,elS,plS,angS,lgS,pa,pb,ria,rib){
  var piA = Math.max(0, getPL().indexOf(pa));
  var piB = Math.max(0, getPL().indexOf(pb));
  var wa = loveWindowForPerson(dateA, piA, ria || 0, 0);
  var wb = loveWindowForPerson(dateB, piB, rib || 0, 3);
  var overlapStart = Math.max(wa.start, wb.start);
  var overlapEnd = Math.min(wa.end, wb.end);
  var hasOverlap = overlapStart <= overlapEnd;
  var coupleStart = hasOverlap ? overlapStart : Math.round((wa.start + wb.start) / 2);
  var coupleEnd = hasOverlap ? overlapEnd : coupleStart + 2;
  var openness = Math.max(48, Math.min(96, Math.round(total * .42 + elS * .18 + plS * .16 + angS * .16 + lgS * .08)));
  var channelMap = {
    'ไฟ': 'กิจกรรมที่มีพลังร่วมกัน งานอีเวนต์ กีฬา โปรเจกต์ที่ต้องตัดสินใจเร็ว หรือพื้นที่ที่ได้แสดงตัวตน',
    'น้ำ': 'วงเพื่อนสนิท ครอบครัว งานดูแลผู้คน คอมมูนิตี้เล็ก ๆ หรือบทสนทนาที่เปิดใจลึก',
    'ลม': 'ออนไลน์ การเรียน คอร์ส เวิร์กช็อป งานสื่อสาร และพื้นที่ที่ได้คุยแลกเปลี่ยนความคิด',
    'ดิน': 'ที่ทำงาน งานอาชีพ ธุรกิจ การเงิน อสังหา หรือกิจวัตรที่พบกันซ้ำจนไว้ใจกัน'
  };
  var mainEl = elS >= 78 ? pa.el : pb.el;
  var risk = pa.ei === pb.ei ? 'อารมณ์หรือรูปแบบเดิมของทั้งคู่คล้ายกันมาก จึงควรระวังการย้ำแผลเดิมซ้ำ ๆ' : 'แรงดึงดูดมาจากความต่าง จึงต้องแปลความต่างให้เป็นการเติมเต็ม ไม่ใช่การเอาชนะ';
  var premiumPlan = [
    'เปิดพื้นที่เจอคนใหม่อย่างน้อยสัปดาห์ละ 1 ครั้งในช่องทางที่ธาตุเด่นสนับสนุน',
    'ใช้กติกา 3 คำถามก่อนเริ่มสัมพันธ์จริงจัง: คุยกันรู้เรื่องไหม, รู้สึกปลอดภัยไหม, เป้าหมายชีวิตไม่ชนกันเกินไปไหม',
    'ถ้าเริ่มคุยแล้ว ให้ดูความสม่ำเสมอ 21 วัน มากกว่าคำหวานช่วงแรก'
  ];
  return {
    wa: wa,
    wb: wb,
    coupleLabel: coupleStart + '–' + coupleEnd + ' ปี',
    openness: openness,
    channel: channelMap[mainEl] || channelMap['ลม'],
    risk: risk,
    premiumPlan: premiumPlan,
    reference: 'อ้างอิงเชิงระบบ: วันเกิด → ดาวประจำวัน/ธาตุ, ราศีสัมพันธ์, ลัคนา และวงรอบ 7 ปีของจังหวะชีวิต ใช้เป็นแนวโน้มเพื่อวางแผนความสัมพันธ์ ไม่ใช่คำทำนายตายตัว'
  };
}

function buildSingleLoveOpportunityModel(dateA, pa, ra, la, ria, lia, RA2){
  var piA = Math.max(0, getPL().indexOf(pa));
  var windowA = loveWindowForPerson(dateA, piA, ria || 0, 2);
  var digit = loveDigitFromDate(dateA);
  var signIdx = (digit + piA + (ria || 0) + (lia || 0)) % 12;
  var fallbackSigns = ['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
  var partnerSign = RA2 && RA2[signIdx] ? RA2[signIdx] : { n: fallbackSigns[signIdx], s: '', el: signIdx % 4 };
  var elNames = ['ไฟ','ดิน','ลม','น้ำ'];
  var partnerEl = typeof partnerSign.el === 'number' ? elNames[partnerSign.el % 4] : (partnerSign.el || pa.el || 'ลม');
  var channelMap = {
    'ไฟ': 'งานอีเวนต์ กิจกรรมที่ได้แสดงตัวตน กีฬา โปรเจกต์ใหม่ หรือพื้นที่ที่ต้องใช้ความกล้า',
    'น้ำ': 'วงเพื่อนสนิท ครอบครัว งานดูแลผู้คน คาเฟ่เงียบ ๆ หรือบทสนทนาที่ได้เปิดใจลึก',
    'ลม': 'ออนไลน์ คอร์สเรียน เวิร์กช็อป งานสื่อสาร คอมมูนิตี้ความรู้ หรือการเดินทางสั้น ๆ',
    'ดิน': 'ที่ทำงาน ธุรกิจ การเงิน อสังหา สถานที่ที่ไปเป็นประจำ หรือคนที่เจอจากกิจวัตรเดิม'
  };
  var traitMap = {
    'ไฟ': 'ตรงไปตรงมา มีแพสชัน ชอบคนจริงใจ ตัดสินใจเร็ว แต่บางครั้งใจร้อน',
    'น้ำ': 'อ่อนโยน ลึกซึ้ง อ่านบรรยากาศเก่ง ต้องการความปลอดภัยทางใจ',
    'ลม': 'คุยสนุก ฉลาด ชอบแลกเปลี่ยนความคิด รักอิสระและไม่ชอบความสัมพันธ์ที่อึดอัด',
    'ดิน': 'มั่นคง รับผิดชอบ รักจริงแบบค่อยเป็นค่อยไป ชอบความชัดเจนและไว้ใจได้'
  };
  var chance = Math.max(52, Math.min(94, 58 + (digit * 3) + (piA * 2) + ((ria || 0) % 9)));
  var monthHints = ['ม.ค.–มี.ค.', 'เม.ย.–มิ.ย.', 'ก.ค.–ก.ย.', 'ต.ค.–ธ.ค.'];
  var monthHint = monthHints[(digit + piA) % monthHints.length];
  return {
    window: windowA,
    chance: chance,
    monthHint: monthHint,
    partnerSignName: partnerSign.n || fallbackSigns[signIdx],
    partnerSignSymbol: partnerSign.s || '',
    partnerElement: partnerEl,
    channel: channelMap[partnerEl] || channelMap['ลม'],
    traits: traitMap[partnerEl] || traitMap['ลม'],
    signal: 'สัญญาณที่ควรสังเกตคือคนที่คุยแล้วใจนิ่งขึ้น ไม่เร่งให้ตัดสินใจ และมีความสม่ำเสมอมากกว่าคำหวานช่วงแรก',
    reference: 'อ้างอิงเชิงระบบ: วันเกิด → ดาวประจำวัน/ธาตุ, ราศีเกิด, ลัคนา และวงรอบ 7 ปีของจังหวะความรัก ใช้เป็นแนวโน้มเพื่อเปิดโอกาส ไม่ใช่คำฟันธงตายตัว'
  };
}

function renderSingleLoveOpportunity(na,pa,ra,la,ria,lia,u,RA2,dateA){
  var wrap=document.getElementById('r1');
  na = escapeHTML(na);
  var premiumUnlocked = premiumIsUnlocked();
  var model = buildSingleLoveOpportunityModel(dateA, pa, ra, la, ria, lia, RA2);
  var premiumHtml = '<div class="love-destiny-premium">'
    + '<div class="ld-section-title">แผนเปิดทางความรัก 3 ขั้น</div>'
    + '<ol>'
    + '<li>เลือกออกไปอยู่ในพื้นที่ที่ตรงกับธาตุของคนที่มีแนวโน้มเข้ามา: ' + escapeHTML(model.channel) + '</li>'
    + '<li>ตั้งกติกาคัดคน: คุยแล้วสบายใจไหม, สม่ำเสมอไหม, เป้าหมายชีวิตไปทางเดียวกันไหม</li>'
    + '<li>ช่วง ' + escapeHTML(model.monthHint) + ' ให้เพิ่มโอกาสเจอคนใหม่อย่างน้อยสัปดาห์ละ 1 ครั้ง</li>'
    + '</ol>'
    + '<div class="ld-note"><strong>สัญญาณคนที่ควรให้โอกาส:</strong> ' + escapeHTML(model.signal) + '</div>'
    + '</div>';
  wrap.innerHTML = '<div class="love-destiny-card single-love-card">'
    + '<div class="ld-kicker">Single Love Timing</div>'
    + '<div class="ld-title">💖 โอกาสเจอคู่ของคุณ</div>'
    + '<div class="ld-summary"><strong>' + na + '</strong> ยังไม่ต้องมีข้อมูลอีกฝ่าย ก็อ่านจังหวะรักจากดวงตัวเองได้ — ช่วงเด่นคือ <span>' + escapeHTML(model.window.label) + '</span></div>'
    + '<div class="ld-grid">'
    + '<div class="ld-box"><small>โอกาสเปิดใจ/เจอคนใหม่</small><strong>' + model.chance + '%</strong><p>เด่นเป็นพิเศษช่วง ' + escapeHTML(model.monthHint) + ' ของรอบปีที่จังหวะรักเปิด</p></div>'
    + '<div class="ld-box"><small>มีแนวโน้มเจอที่ไหน</small><p>' + escapeHTML(model.channel) + '</p></div>'
    + '</div>'
    + '<div class="ld-two">'
    + '<div><b>ราศี/พลังที่มีแนวโน้มเข้ามา</b><br>' + escapeHTML(model.partnerSignSymbol + ' ' + model.partnerSignName) + ' · ธาตุ' + escapeHTML(model.partnerElement) + '</div>'
    + '<div><b>นิสัยคนที่มีแนวโน้มเข้ากัน</b><br>' + escapeHTML(model.traits) + '</div>'
    + '</div>'
    + (premiumUnlocked ? premiumHtml : '<div class="love-destiny-locked">' + premiumLockedCard('love-destiny-lock-card', '<div class="ld-section-title">ปลดล็อกเพื่อดูแผน 3 ขั้น วิธีเปิดโอกาส และสัญญาณคนที่ควรให้โอกาส</div>', 'ปลดล็อกแผนเปิดทางความรัก', 'ดูสถานที่ควรไป วิธีคัดคน และสัญญาณคู่ที่เหมาะกับดวงคุณแบบละเอียด') + '</div>')
    + '<div class="ld-ref">' + escapeHTML(model.reference) + '</div>'
    + '</div>'
    + '<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="1">' + (u.r1 || 'เริ่มใหม่') + '</button></div>';
}

function buildLoveDestinyCard(model, premiumUnlocked, na, nb){
  var premiumHtml = '<div class="love-destiny-premium">'
    + '<div class="ld-section-title">แผนเพิ่มโอกาสให้ได้คู่ที่เข้ากัน</div>'
    + '<ol>' + model.premiumPlan.map(function(item){ return '<li>' + escapeHTML(item) + '</li>'; }).join('') + '</ol>'
    + '<div class="ld-note"><strong>จุดที่ต้องระวัง:</strong> ' + escapeHTML(model.risk) + '</div>'
    + '</div>';
  return '<div class="love-destiny-card">'
    + '<div class="ld-kicker">Love Timing Method</div>'
    + '<div class="ld-title">💖 ดวงคู่รักของคุณกับเขา</div>'
    + '<div class="ld-summary">ช่วงอายุที่ดวงความรักของ <strong>' + na + '</strong> และ <strong>' + nb + '</strong> มีจังหวะเปิดร่วมกัน: <span>' + escapeHTML(model.coupleLabel) + '</span></div>'
    + '<div class="ld-grid">'
    + '<div class="ld-box"><small>โอกาสความสัมพันธ์</small><strong>' + model.openness + '%</strong><p>คะแนนนี้รวมเคมีธาตุ ดาวประจำวัน ราศีสัมพันธ์ และลัคนา เพื่อดูแนวโน้ม ไม่ใช่ฟันธง</p></div>'
    + '<div class="ld-box"><small>ทางที่มีโอกาสเจอคนที่ใช่</small><p>' + escapeHTML(model.channel) + '</p></div>'
    + '</div>'
    + '<div class="ld-two">'
    + '<div><b>' + na + '</b><br>จังหวะเปิดเด่น: ' + escapeHTML(model.wa.label) + '</div>'
    + '<div><b>' + nb + '</b><br>จังหวะเปิดเด่น: ' + escapeHTML(model.wb.label) + '</div>'
    + '</div>'
    + (premiumUnlocked ? premiumHtml : '<div class="love-destiny-locked">' + premiumLockedCard('love-destiny-lock-card', '<div class="ld-section-title">ปลดล็อกเพื่อดูแผน 3 ขั้น วิธีเพิ่มโอกาส และสัญญาณว่าคนนี้ใช่จริงไหม</div>', 'ปลดล็อกแผนความรักเฉพาะคู่', 'ดูวิธีเข้าหา สภาพแวดล้อมที่ควรไป และจุดระวังของคู่นี้แบบละเอียด') + '</div>')
    + '<div class="ld-ref">' + escapeHTML(model.reference) + '</div>'
    + '</div>';
}

function renderCouple(na,pa,ra,la,ria,lia,nb,pb,rb,lb2,rib,lib,u,RA2,dateA,dateB){
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

  var loveDestiny = buildLoveDestinyModel(dateA, dateB, total, elS, plS, angS, lgS, pa, pb, ria, rib);
  var loveDestinyHtml = buildLoveDestinyCard(loveDestiny, premiumUnlocked, na, nb);

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
    + loveDestinyHtml
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
