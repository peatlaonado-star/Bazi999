var LIFE_PERIODS = {

  'อาทิตย์': [
    { period: '0-12 ปี', planet: 'อาทิตย์', meaning: 'พลังชีวิต', strength: 'เป็นผู้นำตั้งแต่เด็ก โดดเด่น', weakness: 'เอาแต่ใจ ควบคุมยาก' },
    { period: '12-24 ปี', planet: 'จันทร์', meaning: 'จิตใจ อารมณ์', strength: 'เข้าใจคน มีเสน่ห์', weakness: 'อ่อนไหว โดนกระทบง่าย' },
    { period: '24-36 ปี', planet: 'อังคาร', meaning: 'แรงขับ การงาน', strength: 'มุ่งมั่น สู้งาน มีพลัง', weakness: 'เผาเรือ เบื่อง่าย ร้อนตัว' },
    { period: '36-48 ปี', planet: 'พุธ', meaning: 'การสื่อสาร การค้า', strength: 'เหมาะทำธุรกิจ ค้าขาย เจรจา', weakness: 'กระจาย เปลี่ยนแผนบ่อย' },
    { period: '48-60 ปี', planet: 'ราหู', meaning: 'พลิกผัน โชค', strength: 'เปลี่ยนแปลงใหญ่ ได้โอกาส', weakness: 'ไม่แน่นอน เสี่ยงพลาด' },
    { period: '60-72 ปี', planet: 'เสาร์', meaning: 'ชื่อเสียง สถานะ', strength: 'ได้รับการยอมรับ มั่นคง', weakness: 'หนัก โดดเดี่ยว' },
    { period: '72-84 ปี', planet: 'พฤหัส', meaning: 'ปัญญา การสอน', strength: 'เป็นปราชญ์ ให้คำปรึกษา', weakness: 'ต้องปล่อยวาง ไม่ยึด' }
  ],

  'จันทร์': [
    { period: '0-12 ปี', planet: 'จันทร์', meaning: 'จิตใจ อารมณ์', strength: 'อ่อนไหว มีศิลปะ', weakness: 'ขี้กลัว โดน bully ง่าย' },
    { period: '12-24 ปี', planet: 'อังคาร', meaning: 'แรงขับ การงาน', strength: 'ฮอร์โมนแรง กล้าแสดงออก', weakness: 'ทะเลาะกับพ่อแม่ หัวรั้น' },
    { period: '24-36 ปี', planet: 'พุธ', meaning: 'การสื่อสาร การค้า', strength: 'ค้าขายดี ทำงานสายสื่อสาร', weakness: 'โกหกเก่ง เจ้าชู้' },
    { period: '36-48 ปี', planet: 'ราหู', meaning: 'พลิกผัน โชค', strength: 'จังหวะเปลี่ยนชีวิตครั้งใหญ่', weakness: 'เสี่ยงทุกทาง ต้องมีสติ' },
    { period: '48-60 ปี', planet: 'เสาร์', meaning: 'ชื่อเสียง สถานะ', strength: 'มั่นคง มีหน้ามีตา', weakness: 'งานหนัก สุขภาพต้องระวัง' },
    { period: '60-72 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ การยอมรับ', strength: 'เป็นที่ปรึกษา เป็นหลักให้คนอื่น', weakness: 'อีโก้สูง หลงตัวเอง' },
    { period: '72-84 ปี', planet: 'จันทร์', meaning: 'พักผ่อน ครอบครัว', strength: 'กลับมาหาครอบครัว สงบ', weakness: 'ซึมเศร้า โดดเดี่ยว' }
  ],

  'อังคาร': [
    { period: '0-12 ปี', planet: 'อังคาร', meaning: 'แรงขับ การงาน', strength: 'กล้า Active', weakness: 'ซน ก้าวร้าว อุบัติเหตุ' },
    { period: '12-24 ปี', planet: 'พุธ', meaning: 'การสื่อสาร การค้า', strength: 'ลูกคุณเจรจาเก่ง หาเงินเองได้', weakness: 'เที่ยว เปลี่ยนใจ หลอกลวง' },
    { period: '24-36 ปี', planet: 'ราหู', meaning: 'พลิกผัน โชค', strength: 'มีโอกาสดีแบบพลิกชีวิต', weakness: 'อุบัติเหตุ ต้องรอบคอบ' },
    { period: '36-48 ปี', planet: 'เสาร์', meaning: 'ชื่อเสียง สถานะ', strength: 'ก้าวหน้าเร็ว อดทน', weakness: 'เหนื่อย แบกหนัก' },
    { period: '48-60 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ การยอมรับ', strength: 'มีคนยอมรับนับถือ', weakness: 'อัตตาใหญ่ ต้องระวัง' },
    { period: '60-72 ปี', planet: 'จันทร์', meaning: 'จิตใจ ครอบครัว', strength: 'ครอบครัวดี เศรษฐกิจดี', weakness: 'โดนคนใกล้ตัวหักหลัง' },
    { period: '72-84 ปี', planet: 'อังคาร', meaning: 'พลังชีวิต', strength: 'สุขภาพแข็งแรง', weakness: 'ความดัน หัวใจ' }
  ],

  'พุธ': [
    { period: '0-12 ปี', planet: 'พุธ', meaning: 'การสื่อสาร การค้า', strength: 'เรียนเก่ง พูดเก่ง ขายเก่ง', weakness: 'โกหก กลับกลอก สมาธิสั้น' },
    { period: '12-24 ปี', planet: 'ราหู', meaning: 'พลิกผัน โชค', strength: 'กล้าลอง ได้เพื่อนหลากหลาย', weakness: 'กับเพื่อนไม่ดีมีปัญหา การเงินรั่ว' },
    { period: '24-36 ปี', planet: 'เสาร์', meaning: 'ชื่อเสียง สถานะ', strength: 'มีวินัย อดทน ก้าวหน้า', weakness: 'หนัก ต้องแบก แรงงาน' },
    { period: '36-48 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ การยอมรับ', strength: 'ผู้นำ เป็นหลักให้คนอื่น', weakness: 'เผาคนอื่น เหนื่อย' },
    { period: '48-60 ปี', planet: 'จันทร์', meaning: 'จิตใจ ครอบครัว', strength: 'การเงินดี ครอบครัวดี', weakness: 'ตัดสินใจช้า โดนกระทบง่าย' },
    { period: '60-72 ปี', planet: 'อังคาร', meaning: 'แรงขับ', strength: 'ยังมีแรงสู้', weakness: 'ความดัน สุขภาพ' },
    { period: '72-84 ปี', planet: 'พฤหัส', meaning: 'ปัญญา การสอน', strength: 'เป็นครู สอนคน ปราชญ์', weakness: 'เหงา ต้องถ่ายทอด' }
  ],

  'พุธกลางคืน': [
    { period: '0-12 ปี', planet: 'ราหู', meaning: 'พลิกผัน', strength: 'เด็กแปลก แตกต่าง', weakness: 'ปรับตัวยากกับสังคม' },
    { period: '12-24 ปี', planet: 'เสาร์', meaning: 'วินัย อดทน', strength: 'โตเกินวัย รับผิดชอบ', weakness: 'เครียด ซึมตั้งแต่เด็ก' },
    { period: '24-36 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ', strength: 'ผู้นำ เป็นหลัก', weakness: 'เหนื่อย อีโก้' },
    { period: '36-48 ปี', planet: 'จันทร์', meaning: 'จิตใจ', strength: 'การเงินดี ครอบครัว', weakness: 'อ่อนไหว' },
    { period: '48-60 ปี', planet: 'อังคาร', meaning: 'พลัง', strength: 'ยังสู้', weakness: 'อุบัติเหตุ สุขภาพ' },
    { period: '60-72 ปี', planet: 'พุธ', meaning: 'การค้า การสื่อสาร', strength: 'เหมาะสอนคน', weakness: 'กังวล' },
    { period: '72-84 ปี', planet: 'ราหู', meaning: 'พลิกผัน', strength: 'เปลี่ยนแปลงปลายชีวิต', weakness: 'อยู่ไม่สุข' }
  ],

  'พฤหัส': [
    { period: '0-12 ปี', planet: 'พฤหัส', meaning: 'ปัญญา การสอน', strength: 'เด็กมีปัญญา น่าเชื่อถือ', weakness: 'ขี้เกรงใจ' },
    { period: '12-24 ปี', planet: 'เสาร์', meaning: 'วินัย อดทน', strength: 'มีวินัย สู้งาน', weakness: 'เหนื่อยตั้งแต่เด็ก' },
    { period: '24-36 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ', strength: 'ประสบความสำเร็จเร็ว', weakness: 'คนอิจฉา' },
    { period: '36-48 ปี', planet: 'จันทร์', meaning: 'จิตใจ ครอบครัว', strength: 'ครอบครัวดี การเงินดี', weakness: 'อ่อนไหว ตัดสินใจช้า' },
    { period: '48-60 ปี', planet: 'อังคาร', meaning: 'แรงขับ', strength: 'มุ่งมั่น ทำงานหนัก', weakness: 'สุขภาพต้องระวัง' },
    { period: '60-72 ปี', planet: 'พุธ', meaning: 'การสื่อสาร การค้า', strength: 'ปลายชีวิตการเงินดี', weakness: 'หลงเชื่อคน' },
    { period: '72-84 ปี', planet: 'ราหู', meaning: 'พลิกผัน', strength: 'เปลี่ยนแปลงอีกครั้ง', weakness: 'อยู่ไม่สุข' }
  ],

  'ศุกร์': [
    { period: '0-12 ปี', planet: 'ศุกร์', meaning: 'ความรัก ศิลปะ การเงิน', strength: 'มีเสน่ห์ สร้างสรรค์', weakness: 'ขี้งอน ใจอ่อน' },
    { period: '12-24 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ', strength: 'เป็นที่ยอมรับตั้งแต่เด็ก', weakness: 'วางตัวเองผิดที่' },
    { period: '24-36 ปี', planet: 'จันทร์', meaning: 'จิตใจ', strength: 'การเงินดี ครอบครัวดี', weakness: 'ใจอ่อนให้คนอื่น' },
    { period: '36-48 ปี', planet: 'อังคาร', meaning: 'แรงขับ', strength: 'มีพลังในการทำงาน', weakness: 'ทะเลาะ ถ้ามีคู่ต้องระวัง' },
    { period: '48-60 ปี', planet: 'พุธ', meaning: 'การสื่อสาร', strength: 'เหมาะค้าขาย เจรจา', weakness: 'กระจาย' },
    { period: '60-72 ปี', planet: 'ราหู', meaning: 'พลิกผัน', strength: 'เปลี่ยนชีวิตปลายทาง', weakness: 'ไม่แน่นอน' },
    { period: '72-84 ปี', planet: 'เสาร์', meaning: 'สถานะ', strength: 'มีคนเคารพ', weakness: 'หนัก เหงา' }
  ],

  'เสาร์': [
    { period: '0-12 ปี', planet: 'เสาร์', meaning: 'สถานะ วินัย', strength: 'โตเกินวัย มีวินัย', weakness: 'เหนื่อย กดดันมาตั้งแต่เด็ก' },
    { period: '12-24 ปี', planet: 'อาทิตย์', meaning: 'ผู้นำ', strength: 'ผู้นำ หาเงินเอง', weakness: 'เผาเรือ ทะเลาะกับผู้ใหญ่' },
    { period: '24-36 ปี', planet: 'จันทร์', meaning: 'จิตใจ ครอบครัว', strength: 'การเงินดี สุขภาพดี', weakness: 'ใจอ่อน' },
    { period: '36-48 ปี', planet: 'อังคาร', meaning: 'แรงขับ', strength: 'ทำงานเก่ง มุ่งมั่น', weakness: 'อุบัติเหตุ ทะเลาะ ทุ่มเทมากไป' },
    { period: '48-60 ปี', planet: 'พุธ', meaning: 'การสื่อสาร', strength: 'ค้าขายดี เจรจา', weakness: 'เปลี่ยนแผน กังวล' },
    { period: '60-72 ปี', planet: 'ราหู', meaning: 'พลิกผัน', strength: 'โอกาสปลายชีวิต', weakness: 'ไม่แน่นอน' },
    { period: '72-84 ปี', planet: 'เสาร์', meaning: 'ปัญญา', strength: 'เป็นหลักให้คน', weakness: 'เหงา ต้องปล่อย' }
  ]

};
