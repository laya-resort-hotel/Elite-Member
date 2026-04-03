import { state, setMode } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoBenefits, demoNews, demoPromotions, demoResident, demoTransactions } from '../data/demo.js';
import { loadCollectionSafe } from '../services/content-service.js';
import { loadTransactions } from '../services/transaction-service.js';
import { renderCards, renderResidentCard, renderTable, renderVaultHome, updateStatusLabels } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';

export async function loadResidentDashboard() {
  const resident = state.currentResident || demoResident;
  renderResidentCard(resident);
  try {
    const [benefits, news, promotions, transactions] = await Promise.all([
      loadCollectionSafe('benefits', { limit: 3 }),
      loadCollectionSafe('news', { limit: 3 }),
      loadCollectionSafe('promotions', { limit: 3 }),
      loadTransactions({ limit: 10, whereMemberCode: resident.memberCode, orderBy: false }),
    ]);
    const finalBenefits = benefits.length ? benefits : demoBenefits;
    const finalNews = news.length ? news : demoNews;
    const finalPromotions = promotions.length ? promotions : demoPromotions;
    if ($('homeNewsHero') || $('homePromotionGrid')) {
      renderVaultHome(finalNews[0] || demoNews[0], finalPromotions);
    }
    if ($('benefitsList')) renderCards($('benefitsList'), finalBenefits, 'No benefits yet');
    if ($('newsList')) renderCards($('newsList'), finalNews, 'No news yet');
    if ($('promoList')) renderCards($('promoList'), finalPromotions, 'No promotions yet');
    if ($('transactionsTable')) renderTable($('transactionsTable'), transactions.length ? transactions : demoTransactions);
  } catch (error) {
    console.warn(error);
    if ($('homeNewsHero') || $('homePromotionGrid')) {
      renderVaultHome(demoNews[0], demoPromotions);
    }
    if ($('benefitsList')) renderCards($('benefitsList'), demoBenefits);
    if ($('newsList')) renderCards($('newsList'), demoNews);
    if ($('promoList')) renderCards($('promoList'), demoPromotions);
    if ($('transactionsTable')) renderTable($('transactionsTable'), demoTransactions);
    showToast('ใช้ข้อมูลตัวอย่างชั่วคราว เพราะอ่าน Firestore ไม่ได้', 'error');
  }
}

export function openDemoResident() {
  state.currentResident = demoResident;
  renderResidentCard(demoResident);
  if ($('homeNewsHero') || $('homePromotionGrid')) {
    renderVaultHome(demoNews[0], demoPromotions);
  }
  if ($('benefitsList')) renderCards($('benefitsList'), demoBenefits);
  if ($('newsList')) renderCards($('newsList'), demoNews);
  if ($('promoList')) renderCards($('promoList'), demoPromotions);
  if ($('transactionsTable')) renderTable($('transactionsTable'), demoTransactions);
  setMode('demo-resident');
  updateStatusLabels({ modeState: 'demo-resident' });
}

export function bindResidentPage() {
  if ($('refreshResidentBtn')) {
    $('refreshResidentBtn').addEventListener('click', async () => {
      if (state.currentMode.includes('live')) {
        await loadResidentDashboard();
        return;
      }
      openDemoResident();
    });
  }
}
