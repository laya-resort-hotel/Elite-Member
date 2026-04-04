import { state, setMode } from '../core/state.js?v=20260404fix5';
import { $ } from '../core/dom.js?v=20260404fix5';
import { loadCollectionSafe } from '../services/content-service.js?v=20260404fix5';
import { loadResidentPointHistory } from '../services/member-service.js?v=20260404fix5';
import { renderCards, renderResidentCard, renderResidentPointHistoryMini, updateStatusLabels, renderVaultHome } from '../ui/renderers.js?v=20260404fix5';
import { showToast } from '../ui/toast.js?v=20260404fix5';

function emptyResident() {
  return {
    fullName: 'No member linked',
    tier: 'Elite Black',
    status: 'INACTIVE',
    residence: '-',
    memberCode: '-',
    publicCardCode: '-',
    qrCodeValue: '-',
    cardNumber: '-',
    points: 0,
    totalSpend: 0,
    pendingPoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    email: '',
  };
}

export async function loadResidentDashboard() {
  const resident = state.currentResident || emptyResident();
  renderResidentCard(resident);

  if (!state.currentResident) {
    showToast('ไม่พบข้อมูลสมาชิกใน Firebase สำหรับบัญชีนี้', 'error');
  }

  try {
    const [benefits, news, promotions, pointHistory] = await Promise.all([
      loadCollectionSafe('benefits', { limit: 3 }),
      loadCollectionSafe('news', { limit: 3 }),
      loadCollectionSafe('promotions', { limit: 3 }),
      state.currentResident?.residentId ? loadResidentPointHistory(state.currentResident.residentId, 8) : Promise.resolve([]),
    ]);

    if ($('homeNewsHero') || $('homePromotionGrid')) {
      renderVaultHome(news[0] || null, promotions);
    }
    if ($('benefitsList')) renderCards($('benefitsList'), benefits, 'No benefits yet');
    if ($('newsList')) renderCards($('newsList'), news, 'No news yet');
    if ($('promoList')) renderCards($('promoList'), promotions, 'No promotions yet');
    if ($('residentPointHistoryMini')) renderResidentPointHistoryMini($('residentPointHistoryMini'), pointHistory, 'No point history yet');
  } catch (error) {
    console.error(error);
    if ($('benefitsList')) renderCards($('benefitsList'), [], 'No benefits yet');
    if ($('newsList')) renderCards($('newsList'), [], 'No news yet');
    if ($('promoList')) renderCards($('promoList'), [], 'No promotions yet');
    if ($('residentPointHistoryMini')) renderResidentPointHistoryMini($('residentPointHistoryMini'), [], 'No point history yet');
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
