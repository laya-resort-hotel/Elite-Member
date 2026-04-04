import { demoBenefits, demoPromotions } from './demo.js?v=20260404fix4';

function imageOf(item) {
  return item.coverImageUrl || item.galleryImages?.[0]?.url || '';
}

export const demoRewards = [
  {
    id: 'reward-prawn-roll',
    title: 'Crispy Roll Set',
    pointsRequired: 5200,
    outlet: 'Aroonsawat',
    imageUrl: imageOf(demoPromotions[0] || {}),
    summary: 'แลกรับเมนูทานเล่น 1 ที่ ตามเงื่อนไขที่กำหนด',
  },
  {
    id: 'reward-dessert',
    title: 'Free Dessert',
    pointsRequired: 8800,
    outlet: 'The Taste',
    imageUrl: imageOf(demoBenefits[0] || {}),
    summary: 'แลกรับของหวานที่ร่วมรายการ 1 เมนู',
  },
  {
    id: 'reward-drink',
    title: 'Any Glass Drink',
    pointsRequired: 9200,
    outlet: 'Aroonsawat',
    imageUrl: imageOf(demoPromotions[1] || demoBenefits[1] || {}),
    summary: 'แลกรับเครื่องดื่มแก้วเดี่ยวตามเมนูที่ร่วมรายการ',
  },
];
