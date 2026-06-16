// ============================================
// STARVIA — กราฟชีวิต 7 ช่วง 5 ด้าน
// Life trajectory mapped across cosmic cycles
// ============================================

var LIFE_GRAPH_DATA = {

  'อาทิตย์': [
    { period: '0-12', career: 3, money: 3, love: 2, health: 4, luck: 2, description: 'เด็กมีพลัง เป็นผู้นำตั้งแต่เด็ก แต่โชคยังไม่มา' },
    { period: '12-24', career: 3, money: 3, love: 4, health: 4, luck: 3, description: 'มีเสน่ห์ เข้าสังคม เรียนจบ เริ่มทำงาน' },
    { period: '24-36', career: 5, money: 4, love: 3, health: 3, luck: 4, description: 'พีคสุดของชีวิตการงาน มุ่งมั่น แต่สุขภาพเริ่มทรุด' },
    { period: '36-48', career: 4, money: 4, love: 3, health: 3, luck: 4, description: 'การเงินดี การงานนิ่ง ถึงเวลาสื่อสาร เปิดตัว' },
    { period: '48-60', career: 4, money: 5, love: 4, health: 3, luck: 5, description: 'การเงิน+โชคพีคที่สุด จุดสูงสุดของชีวิต' },
    { period: '60-72', career: 5, money: 4, love: 4, health: 2, luck: 3, description: 'ชื่อเสียงสูง แต่สุขภาพต้องระวัง' },
    { period: '72-84', career: 3, money: 3, love: 4, health: 3, luck: 3, description: 'ปัญญา สอนคน สงบ' }
  ],

  'จันทร์': [
    { period: '0-12', career: 2, money: 2, love: 4, health: 3, luck: 2, description: 'เด็กอ่อนไหว มีศิลปะ ต้องการการดูแล' },
    { period: '12-24', career: 4, money: 3, love: 3, health: 4, luck: 3, description: 'ฮอร์โมนแรง กล้า เริ่มมีพลัง' },
    { period: '24-36', career: 4, money: 4, love: 4, health: 3, luck: 4, description: 'การเงินดี ค้าขายดี เหมาะทำงานสื่อสาร' },
    { period: '36-48', career: 5, money: 5, love: 3, health: 3, luck: 5, description: 'ช่วงพลิกผัน การเงินพีค โอกาสมา' },
    { period: '48-60', career: 4, money: 4, love: 4, health: 2, luck: 4, description: 'มั่นคง แต่สุขภาพต้องดูแล' },
    { period: '60-72', career: 5, money: 3, love: 4, health: 3, luck: 3, description: 'เป็นที่ปรึกษา มีคนนับถือ' },
    { period: '72-84', career: 3, money: 3, love: 5, health: 3, luck: 3, description: 'กลับมาหาครอบครัว สงบ' }
  ],

  'อังคาร': [
    { period: '0-12', career: 2, money: 2, love: 2, health: 3, luck: 2, description: 'เด็กซน มีพลัง ต้องดูแลอุบัติเหตุ' },
    { period: '12-24', career: 4, money: 4, love: 4, health: 4, luck: 3, description: 'เริ่มหารายได้เอง เจรจาเก่ง' },
    { period: '24-36', career: 5, money: 3, love: 3, health: 3, luck: 5, description: 'ช่วงเปลี่ยนชีวิต พลิกผัน โอกาสมา' },
    { period: '36-48', career: 5, money: 4, love: 3, health: 2, luck: 4, description: 'การงานพีค สร้างเนื้อสร้างตัว' },
    { period: '48-60', career: 4, money: 4, love: 4, health: 3, luck: 4, description: 'เป็นที่ยอมรับ มีชื่อเสียง' },
    { period: '60-72', career: 4, money: 4, love: 4, health: 3, luck: 3, description: 'ครอบครัวดี การเงินดี' },
    { period: '72-84', career: 3, money: 3, love: 3, health: 3, luck: 3, description: 'สุขภาพต้องดูแล ความดัน' }
  ],

  'พุธ': [
    { period: '0-12', career: 4, money: 3, love: 3, health: 4, luck: 3, description: 'เด็กเรียนดี พูดเก่ง ขายเก่งตั้งแต่เด็ก' },
    { period: '12-24', career: 4, money: 3, love: 3, health: 4, luck: 5, description: 'ราหูมา พลิกผัน ได้โอกาส' },
    { period: '24-36', career: 5, money: 4, love: 3, health: 3, luck: 4, description: 'งานหนัก อดทน ก้าวหน้า' },
    { period: '36-48', career: 5, money: 5, love: 4, health: 3, luck: 5, description: 'พีคที่สุด ทุกด้าน' },
    { period: '48-60', career: 4, money: 4, love: 4, health: 3, luck: 4, description: 'การเงินดี ครอบครัวดี' },
    { period: '60-72', career: 3, money: 3, love: 3, health: 3, luck: 3, description: 'สุขภาพเปลี่ยน ต้องดูแล' },
    { period: '72-84', career: 4, money: 3, love: 3, health: 3, luck: 3, description: 'ปัญญา สอนคน' }
  ],

  'พฤหัส': [
    { period: '0-12', career: 3, money: 3, love: 3, health: 4, luck: 3, description: 'เด็กมีปัญญา น่าเชื่อถือ' },
    { period: '12-24', career: 4, money: 3, love: 3, health: 4, luck: 3, description: 'อดทน รับผิดชอบ' },
    { period: '24-36', career: 5, money: 4, love: 4, health: 4, luck: 4, description: 'ผู้นำ ประสบความสำเร็จเร็ว' },
    { period: '36-48', career: 4, money: 5, love: 4, health: 3, luck: 4, description: 'การเงินพีค ครอบครัวดี' },
    { period: '48-60', career: 4, money: 4, love: 3, health: 3, luck: 4, description: 'ทำงานหนัก สุขภาพต้องระวัง' },
    { period: '60-72', career: 5, money: 4, love: 4, health: 3, luck: 4, description: 'ปลายชีวิตการเงินดีอีกครั้ง' },
    { period: '72-84', career: 3, money: 3, love: 4, health: 3, luck: 3, description: 'เปลี่ยนแปลงอีกครั้ง' }
  ],

  'ศุกร์': [
    { period: '0-12', career: 3, money: 3, love: 4, health: 4, luck: 4, description: 'มีเสน่ห์ สร้างสรรค์ มีโชค' },
    { period: '12-24', career: 3, money: 4, love: 3, health: 4, luck: 3, description: 'มีคนช่วยเหลือ เริ่มมีรายได้' },
    { period: '24-36', career: 4, money: 4, love: 4, health: 4, luck: 4, description: 'ปีทองทั้ง 5 ด้าน สมดุล' },
    { period: '36-48', career: 5, money: 4, love: 3, health: 3, luck: 4, description: 'ทำงานหนัก มีพลัง' },
    { period: '48-60', career: 4, money: 5, love: 4, health: 3, luck: 5, description: 'การเงิน+โชคพีค ค้าขายรุ่ง' },
    { period: '60-72', career: 4, money: 4, love: 3, health: 3, luck: 5, description: 'เปลี่ยนชีวิตปลายทาง โชคดี' },
    { period: '72-84', career: 4, money: 3, love: 4, health: 3, luck: 3, description: 'มีคนเคารพ มั่นคง' }
  ],

  'เสาร์': [
    { period: '0-12', career: 2, money: 2, love: 2, health: 3, luck: 2, description: 'เด็กโตเกินวัย มีวินัย กดดัน' },
    { period: '12-24', career: 4, money: 3, love: 3, health: 4, luck: 2, description: 'มีพลังผู้นำ หาเงินเอง' },
    { period: '24-36', career: 4, money: 5, love: 4, health: 4, luck: 4, description: 'การเงินพีค ครอบครัวดี' },
    { period: '36-48', career: 5, money: 4, love: 3, health: 3, luck: 4, description: 'ทำงานเก่ง มุ่งมั่น สุขภาพเริ่มเปลี่ยน' },
    { period: '48-60', career: 4, money: 4, love: 4, health: 3, luck: 4, description: 'ค้าขายดี การเงินนิ่ง' },
    { period: '60-72', career: 5, money: 3, love: 4, health: 2, luck: 5, description: 'โชคปลายชีวิต แต่สุขภาพไม่ดี' },
    { period: '72-84', career: 4, money: 3, love: 4, health: 3, luck: 3, description: 'ปัญญา เป็นหลักให้คน' }
  ]

};
