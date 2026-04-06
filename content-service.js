export const demoResident = {
  id: 'demo-resident-001',
  memberId: 'ECB000001',
  publicCardCode: 'LAYA-0001',
  memberCode: 'LAYA-0001',
  fullName: 'Noi Resident',
  tier: 'Elite Black',
  status: 'ACTIVE',
  residence: 'D-108',
  email: 'resident@demo.local',
  points: 42580,
  totalSpend: 238900,
};

function gallery(urls = []) {
  return urls.map((url, index) => ({
    url,
    name: `demo-image-${index + 1}.jpg`,
    path: '',
  }));
}

export const demoBenefits = [
  {
    id: 'benefit-dining-privilege',
    title: 'Dining Privilege',
    summary: 'รับส่วนลด 15% ที่ Aroonsawat และ The Taste สำหรับสมาชิก Resident ที่ลงทะเบียนแล้ว',
    body: 'รับส่วนลด 15% ที่ Aroonsawat และ The Taste สำหรับสมาชิก Resident ที่ลงทะเบียนแล้ว',
    fullDetails: `ใช้ได้สำหรับสมาชิก Resident ที่แสดง Elite Black Card หรือ QR Member ก่อนชำระเงิน
สิทธิ์ครอบคลุมค่าอาหารและเครื่องดื่มที่ร่วมรายการตามเงื่อนไขโรงแรม
ไม่สามารถใช้ร่วมกับโปรโมชันลดราคาอื่น เว้นแต่โรงแรมประกาศเป็นกรณีพิเศษ`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
  {
    id: 'benefit-resident-exclusive-rate',
    title: 'Resident Exclusive Rate',
    summary: 'รับสิทธิ์ราคาพิเศษสำหรับบริการ select experiences และบริการภายในรีสอร์ต',
    body: 'รับสิทธิ์ราคาพิเศษสำหรับบริการ select experiences และบริการภายในรีสอร์ต',
    fullDetails: `ใช้สิทธิ์ได้กับแพ็กเกจที่โรงแรมประกาศเป็น Resident Exclusive เท่านั้น
ครอบคลุมบางบริการ เช่น dining events, recreation และ seasonal activities
พนักงานสามารถตรวจสอบ eligibility ผ่านระบบ Members และ QR code ได้ทันที`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
  {
    id: 'benefit-priority-assistance',
    title: 'Priority Assistance',
    summary: 'ช่องทางติดต่อพิเศษสำหรับ Resident services และ concierge support',
    body: 'ช่องทางติดต่อพิเศษสำหรับ Resident services และ concierge support',
    fullDetails: `รองรับการประสานงานเรื่อง stay support, owner assistance และ guest coordination
ช่วยลดเวลาการติดต่อสำหรับ Resident ที่มีคำขอเร่งด่วน
สามารถใช้ผ่านหน้า Contact / Concierge ในระบบได้โดยตรง`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
];

export const demoNews = [
  {
    id: 'news-resident-sunset-reception',
    title: 'Resident Sunset Reception',
    summary: 'เชิญร่วมงานรับรอง Resident ประจำเดือน ณ Beach Lawn เวลา 18:00 น.',
    body: 'เชิญร่วมงานรับรอง Resident ประจำเดือน ณ Beach Lawn เวลา 18:00 น.',
    fullDetails: `งานพบปะ Resident ประจำเดือนในบรรยากาศ sunset networking ริมทะเล
มี welcome drink, canapés และอัปเดตข่าวสารจากทีมบริหารโรงแรม
ทีม Resident Relations จะเปิดโต๊ะช่วยเหลือสำหรับคำถามเรื่องสิทธิพิเศษและ point program`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
  {
    id: 'news-owner-update',
    title: 'Owner Update',
    summary: 'อัปเดตผลการบริหารห้องและ occupancy summary พร้อมให้ดูใน resident office',
    body: 'อัปเดตผลการบริหารห้องและ occupancy summary พร้อมให้ดูใน resident office',
    fullDetails: `สรุป occupancy trend, guest demand และภาพรวมผลการบริหารห้องในช่วงที่ผ่านมา
มีเจ้าหน้าที่ช่วยอธิบายรายงานและตอบคำถามเกี่ยวกับ owner performance summary
สามารถนัดหมายเวลาพูดคุยเพิ่มเติมกับทีมที่ดูแล Resident ได้`,
    details: [
      'สรุป occupancy trend, guest demand และภาพรวมผลการบริหารห้องในช่วงที่ผ่านมา',
      'มีเจ้าหน้าที่ช่วยอธิบายรายงานและตอบคำถามเกี่ยวกับ owner performance summary',
      'สามารถนัดหมายเวลาพูดคุยเพิ่มเติมกับทีมที่ดูแล Resident ได้',
    ],
    terms: [
      'ข้อมูลบางส่วนใช้เพื่อการอ้างอิงภายในของ Resident เท่านั้น',
    ],
    ctaLabel: 'Request Meeting',
    coverImageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
];

export const demoPromotions = [
  {
    id: 'promo-wine-and-dine-weekend',
    title: 'Wine & Dine Weekend',
    summary: 'รับคะแนนพิเศษ x2 เมื่อใช้จ่ายครบ 3,000 บาท ที่ outlet ที่ร่วมรายการ',
    body: 'รับคะแนนพิเศษ x2 เมื่อใช้จ่ายครบ 3,000 บาท ที่ outlet ที่ร่วมรายการ',
    fullDetails: `สะสมคะแนนคูณสองเมื่อใช้จ่ายตามยอดที่กำหนดในช่วงวันศุกร์ถึงอาทิตย์
เหมาะสำหรับ Resident ที่ใช้จ่ายใน Aroonsawat, The Taste และกิจกรรม dining ที่ร่วมรายการ
คะแนนจะเข้า wallet หลังจากพนักงานบันทึก transaction ผ่านระบบหลังบ้านเรียบร้อย`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
  {
    id: 'promo-spa-retreat-offer',
    title: 'Spa Retreat Offer',
    summary: 'แพ็กเกจสปาสำหรับสมาชิกพร้อม late checkout benefits ตามเงื่อนไข',
    body: 'แพ็กเกจสปาสำหรับสมาชิกพร้อม late checkout benefits ตามเงื่อนไข',
    fullDetails: `Resident รับสิทธิ์แพ็กเกจสปาราคาพิเศษ พร้อม benefit เสริมในวันที่กำหนด
สามารถใช้ร่วมกับวันพักผ่อนส่วนตัวหรือมอบเป็นสิทธิ์สำหรับการเข้าพักของแขกภายใต้เงื่อนไขโรงแรม
พนักงานจะตรวจสอบสิทธิ์และบันทึก point earning ให้หลังใช้บริการ`,
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
    coverImageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
    galleryImages: gallery([
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80',
    ]),
  },
];

export const demoTransactions = [
  { createdLabel: '2026-04-02 19:20', outlet: 'Aroonsawat', amount: 2200, points: 2200, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-04-01 12:05', outlet: 'The Taste', amount: 1800, points: 1800, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-03-28 16:40', outlet: 'Spa', amount: 4500, points: 4500, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
];
