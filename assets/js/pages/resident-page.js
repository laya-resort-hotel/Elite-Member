
import { state, setMode } from '../core/state.js?v=20260404fix2';
import { $ } from '../core/dom.js?v=20260404fix2';
import { loadCollectionSafe } from '../services/content-service.js?v=20260404fix2';
import { loadTransactions } from '../services/transaction-service.js?v=20260404fix2';
import { renderCards, renderResidentCard, renderTable, renderVaultHome, updateStatusLabels } from '../ui/renderers.js?v=20260404fix2';
import { showToast } from '../ui/toast.js?v=20260404fix2';

function emptyResident() {
  return {
    fullName: 'No member linked',
    tier: 'Elite Black',
    status: 'INACTIVE',
    residence: '-',
    memberCode: '-',
    publicCardCode: '-',
    points: 0,
    totalSpend: 0,
  };
}

export async function loadResidentDashboard() {
  const resident = state.currentResident || emptyResident();
  renderResidentCard(resident);

  if (!state.currentResident) {
    showToast('ไม่พบข้อมูลสมาชิกใน Firebase สำหรับบัญชีนี้', 'error');
  }

  try {
    const [benefits, news, promotions, transactions] = await Promise.all([
      loadCollectionSafe('benefits', { limit: 3 }),
      loadCollectionSafe('news', { limit: 3 }),
      loadCollectionSafe('promotions', { limit: 3 }),
      state.currentResident?.memberCode ? loadTransactions({ limit: 10, whereMemberCode: resident.memberCode }) : Promise.resolve([]),
    ]);

    if ($('homeNewsHero') || $('homePromotionGrid')) {
      renderVaultHome(news[0] || null, promotions);
    }
    if ($('benefitsList')) renderCards($('benefitsList'), benefits, 'No benefits yet');
    if ($('newsList')) renderCards($('newsList'), news, 'No news yet');
    if ($('promoList')) renderCards($('promoList'), promotions, 'No promotions yet');
    if ($('transactionsTable')) renderTable($('transactionsTable'), transactions, 'No transactions yet');
  } catch (error) {
    console.error(error);
    if ($('benefitsList')) renderCards($('benefitsList'), [], 'No benefits yet');
    if ($('newsList')) renderCards($('newsList'), [], 'No news yet');
    if ($('promoList')) renderCards($('promoList'), [], 'No promotions yet');
    if ($('transactionsTable')) renderTable($('transactionsTable'), [], 'No transactions yet');
    showToast('อ่านข้อมูลจาก Firebase ไม่สำเร็จ', 'error');
  }
}

export function openDemoResident() {
  setMode('resident-live');
  updateStatusLabels({ modeState: 'resident-live' });
}

export function bindResidentPage() {
  if ($('refreshResidentBtn') && !$('refreshResidentBtn').dataset.bound) {
    $('refreshResidentBtn').dataset.bound = '1';
    $('refreshResidentBtn').addEventListener('click', async () => {
      await loadResidentDashboard();
    });
  }
}
