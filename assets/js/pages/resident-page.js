import { state, setMode } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoBenefits, demoNews, demoPromotions, demoResident, demoTransactions } from '../data/demo.js';
import { loadCollectionSafe } from '../services/content-service.js';
import { loadTransactions } from '../services/transaction-service.js';
import { renderCards, renderResidentCard, renderTable, updateStatusLabels } from '../ui/renderers.js';
import { setScreen } from '../ui/navigation.js';
import { showToast } from '../ui/toast.js';

export async function loadResidentDashboard() {
  const resident = state.currentResident || demoResident;
  renderResidentCard(resident);
  try {
    const [benefits, news, promotions, transactions] = await Promise.all([
      loadCollectionSafe('benefits', { limit: 6 }),
      loadCollectionSafe('news', { limit: 5 }),
      loadCollectionSafe('promotions', { limit: 5 }),
      loadTransactions({ limit: 10, whereMemberCode: resident.memberCode, orderBy: false }),
    ]);
    renderCards($('benefitsList'), benefits.length ? benefits : demoBenefits, 'No benefits yet');
    renderCards($('newsList'), news.length ? news : demoNews, 'No news yet');
    renderCards($('promoList'), promotions.length ? promotions : demoPromotions, 'No promotions yet');
    renderTable($('transactionsTable'), transactions.length ? transactions : demoTransactions);
  } catch (error) {
    console.warn(error);
    renderCards($('benefitsList'), demoBenefits);
    renderCards($('newsList'), demoNews);
    renderCards($('promoList'), demoPromotions);
    renderTable($('transactionsTable'), demoTransactions);
    showToast('ใช้ข้อมูลตัวอย่างชั่วคราว เพราะอ่าน Firestore ไม่ได้', 'error');
  }
}

export function openDemoResident() {
  state.currentResident = demoResident;
  renderResidentCard(demoResident);
  renderCards($('benefitsList'), demoBenefits);
  renderCards($('newsList'), demoNews);
  renderCards($('promoList'), demoPromotions);
  renderTable($('transactionsTable'), demoTransactions);
  setMode('demo-resident');
  updateStatusLabels({ modeState: 'demo-resident' });
  setScreen('screen-resident');
}

export function bindResidentPage() {
  $('refreshResidentBtn').addEventListener('click', async () => {
    if (state.currentMode.includes('live')) {
      await loadResidentDashboard();
      return;
    }
    openDemoResident();
  });
}
