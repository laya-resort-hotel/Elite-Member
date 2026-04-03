export const demoResident = {
  id: 'demo-resident-001',
  memberCode: 'LAYA-0001',
  fullName: 'Noi Resident',
  tier: 'Elite Black',
  status: 'ACTIVE',
  residence: 'D-108',
  email: 'resident@demo.local',
  points: 42580,
  totalSpend: 238900,
};

export const demoBenefits = [
  {
    id: 'benefit-dining-privilege',
    title: 'Dining Privilege',
    summary: 'รับส่วนลด 15% ที่ Aroonsawat และ The Taste สำหรับสมาชิก Resident ที่ลงทะเบียนแล้ว',
    body: 'รับส่วนลด 15% ที่ Aroonsawat และ The Taste สำหรับโต๊ะที่ลงทะเบียนสมาชิก',
    details: [
      'ใช้ได้สำหรับสมาชิก Resident ที่แสดง Elite Black Card หรือ QR Member ก่อนชำระเงิน',
      'สิทธิ์ครอบคลุมค่าอาหารและเครื่องดื่มที่ร่วมรายการตามเงื่อนไขโรงแรม',
      'ไม่สามารถใช้ร่วมกับโปรโมชันลดราคาอื่น เว้นแต่โรงแรมประกาศเป็นกรณีพิเศษ',
    ],
    terms: [
      'โปรดแจ้งการใช้สิทธิ์ก่อนสรุปบิล',
      'ส่วนลดไม่ครอบคลุมสินค้าโปรโมชั่นหรือแพ็กเกจ event พิเศษ',
      'โรงแรมขอสงวนสิทธิ์เปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งล่วงหน้า',
    ],
    ctaLabel: 'Contact Dining Team',
  },
  {
    id: 'benefit-resident-exclusive-rate',
    title: 'Resident Exclusive Rate',
    summary: 'รับสิทธิ์ราคาพิเศษสำหรับบริการ select experiences และบริการภายในรีสอร์ต',
    body: 'รับสิทธิ์ราคาพิเศษสำหรับบริการภายในรีสอร์ตและกิจกรรม select experiences',
    details: [
      'ใช้สิทธิ์ได้กับแพ็กเกจที่โรงแรมประกาศเป็น Resident Exclusive เท่านั้น',
      'ครอบคลุมบางบริการ เช่น dining events, recreation และ seasonal activities',
      'พนักงานสามารถตรวจสอบ eligibility ผ่านระบบ Members และ QR code ได้ทันที',
    ],
    terms: [
      'สิทธิ์ขึ้นอยู่กับวันเข้าพักและช่วงเวลาโปรโมชัน',
      'ราคาพิเศษอาจมีจำนวนจำกัดในบางกิจกรรม',
    ],
    ctaLabel: 'Ask Concierge',
  },
  {
    id: 'benefit-priority-assistance',
    title: 'Priority Assistance',
    summary: 'ช่องทางติดต่อพิเศษสำหรับ Resident services และ concierge support',
    body: 'ช่องทางติดต่อพิเศษสำหรับ Resident services และ concierge support',
    details: [
      'รองรับการประสานงานเรื่อง stay support, owner assistance และ guest coordination',
      'ช่วยลดเวลาการติดต่อสำหรับ Resident ที่มีคำขอเร่งด่วน',
      'สามารถใช้ผ่านหน้า Contact / Concierge ในระบบได้โดยตรง',
    ],
    terms: [
      'บริการขึ้นอยู่กับเวลาทำการและลักษณะคำขอ',
      'คำขอบางประเภทอาจต้องใช้เวลาประสานงานเพิ่มเติม',
    ],
    ctaLabel: 'Open Concierge',
  },
];

export const demoNews = [
  {
    id: 'news-resident-sunset-reception',
    title: 'Resident Sunset Reception',
    summary: 'เชิญร่วมงานรับรอง Resident ประจำเดือน ณ Beach Lawn เวลา 18:00 น.',
    body: 'เชิญร่วมงานรับรอง Resident ประจำเดือน ณ Beach Lawn เวลา 18:00 น.',
    details: [
      'งานพบปะ Resident ประจำเดือนในบรรยากาศ sunset networking ริมทะเล',
      'มี welcome drink, canapés และอัปเดตข่าวสารจากทีมบริหารโรงแรม',
      'ทีม Resident Relations จะเปิดโต๊ะช่วยเหลือสำหรับคำถามเรื่องสิทธิพิเศษและ point program',
    ],
    terms: [
      'กรุณาลงทะเบียนล่วงหน้าเพื่อสำรองที่นั่ง',
      'จำนวนผู้เข้าร่วมอาจถูกจำกัดตามพื้นที่จัดงาน',
    ],
    ctaLabel: 'Register Interest',
  },
  {
    id: 'news-owner-update',
    title: 'Owner Update',
    summary: 'อัปเดตผลการบริหารห้องและ occupancy summary พร้อมให้ดูใน resident office',
    body: 'อัปเดตผลการบริหารห้องและ occupancy summary พร้อมให้ดูใน resident office',
    details: [
      'สรุป occupancy trend, guest demand และภาพรวมผลการบริหารห้องในช่วงที่ผ่านมา',
      'มีเจ้าหน้าที่ช่วยอธิบายรายงานและตอบคำถามเกี่ยวกับ owner performance summary',
      'สามารถนัดหมายเวลาพูดคุยเพิ่มเติมกับทีมที่ดูแล Resident ได้',
    ],
    terms: [
      'ข้อมูลบางส่วนใช้เพื่อการอ้างอิงภายในของ Resident เท่านั้น',
    ],
    ctaLabel: 'Request Meeting',
  },
];

export const demoPromotions = [
  {
    id: 'promo-wine-and-dine-weekend',
    title: 'Wine & Dine Weekend',
    summary: 'รับคะแนนพิเศษ x2 เมื่อใช้จ่ายครบ 3,000 บาท ที่ outlet ที่ร่วมรายการ',
    body: 'รับคะแนนพิเศษ x2 เมื่อใช้จ่ายครบ 3,000 บาท ที่ outlet ที่ร่วมรายการ',
    details: [
      'สะสมคะแนนคูณสองเมื่อใช้จ่ายตามยอดที่กำหนดในช่วงวันศุกร์ถึงอาทิตย์',
      'เหมาะสำหรับ Resident ที่ใช้จ่ายใน Aroonsawat, The Taste และกิจกรรม dining ที่ร่วมรายการ',
      'คะแนนจะเข้า wallet หลังจากพนักงานบันทึก transaction ผ่านระบบหลังบ้านเรียบร้อย',
    ],
    terms: [
      'ยอดสุทธิต้องเป็นไปตามเงื่อนไขก่อนหักส่วนลดอื่น',
      'คะแนนพิเศษอาจใช้เวลาประมวลผลภายใน 24 ชั่วโมง',
    ],
    ctaLabel: 'See Participating Outlets',
  },
  {
    id: 'promo-spa-retreat-offer',
    title: 'Spa Retreat Offer',
    summary: 'แพ็กเกจสปาสำหรับสมาชิกพร้อม late checkout benefits ตามเงื่อนไข',
    body: 'แพ็กเกจสปาสำหรับสมาชิกพร้อม late checkout benefits ตามเงื่อนไข',
    details: [
      'Resident รับสิทธิ์แพ็กเกจสปาราคาพิเศษ พร้อม benefit เสริมในวันที่กำหนด',
      'สามารถใช้ร่วมกับวันพักผ่อนส่วนตัวหรือมอบเป็นสิทธิ์สำหรับการเข้าพักของแขกภายใต้เงื่อนไขโรงแรม',
      'พนักงานจะตรวจสอบสิทธิ์และบันทึก point earning ให้หลังใช้บริการ',
    ],
    terms: [
      'late checkout ขึ้นอยู่กับ availability ของวันนั้น',
      'กรุณาจองล่วงหน้าอย่างน้อย 24 ชั่วโมง',
    ],
    ctaLabel: 'Book Spa',
  },
];

export const demoTransactions = [
  { createdLabel: '2026-04-02 19:20', outlet: 'Aroonsawat', amount: 2200, points: 2200, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-04-01 12:05', outlet: 'The Taste', amount: 1800, points: 1800, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-03-28 16:40', outlet: 'Spa', amount: 4500, points: 4500, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
];
