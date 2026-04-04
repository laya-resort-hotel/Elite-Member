
import { state } from '../core/state.js?v=20260404fix4';
import { $ } from '../core/dom.js?v=20260404fix4';
import { escapeHtml, formatNumber } from '../core/format.js?v=20260404fix4';
import { renderResidentCard } from '../ui/renderers.js?v=20260404fix4';
import { showToast } from '../ui/toast.js?v=20260404fix4';
import { loadCollectionSafe } from '../services/content-service.js?v=20260404fix4';

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

export async function loadRedemptionPage() {
  const resident = state.currentResident || emptyResident();
  renderResidentCard(resident);
  const points = Number(resident.points || 0);
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(points);

  try {
    const benefits = await loadCollectionSafe('benefits', { limit: 50 });
    const rewards = benefits.filter((item) => item.isActive !== false && (item.pointsCost || item.redemptionMode === 'points' || item.benefitType === 'reward'));
    renderRewards(rewards, points);
  } catch (error) {
    console.error(error);
    renderRewards([], points);
    showToast('อ่าน rewards จาก Firebase ไม่สำเร็จ', 'error');
  }
}

function renderRewards(rewards = [], points) {
  const container = $('rewardList');
  if (!container) return;
  if (!rewards.length) {
    container.innerHTML = '<div class="card-item"><p>No rewards available</p></div>';
    return;
  }
  container.innerHTML = rewards.map((reward) => {
    const pointsRequired = Number(reward.pointsCost || 0);
    const canRedeem = points >= pointsRequired;
    const imageUrl = reward.coverImageUrl || reward.galleryImages?.[0]?.url || '';
    return `
      <div class="reward-card vault-reward-card">
        <div class="reward-thumb vault-reward-thumb">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(reward.title || 'Reward')}" />` : '<div class="reward-thumb-placeholder">Reward</div>'}</div>
        <div class="reward-info vault-reward-info">
          <h3>${escapeHtml(reward.title || 'Reward')}</h3>
          <div class="reward-meta vault-points-text">${formatNumber(pointsRequired)} Point(s)</div>
        </div>
        <div class="reward-action vault-reward-action">
          <button type="button" class="vault-redeem-btn ${canRedeem ? 'ready' : 'disabled'}" data-reward-id="${escapeHtml(reward.id || '')}" ${canRedeem ? '' : 'disabled'}>Redeem</button>
        </div>
      </div>
    `;
  }).join('');
  container.querySelectorAll('[data-reward-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Redemption flow จะทำต่อในรอบถัดไป', 'success');
    });
  });
}
