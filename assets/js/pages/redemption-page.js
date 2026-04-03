import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoResident } from '../data/demo.js';
import { demoRewards } from '../data/rewards.js';
import { escapeHtml, formatNumber } from '../core/format.js';
import { showToast } from '../ui/toast.js';

export function loadRedemptionPage() {
  const resident = state.currentResident || demoResident;
  const points = Number(resident.points || 0);
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(points);
  if ($('redemptionPointsBadge')) $('redemptionPointsBadge').textContent = `${formatNumber(points)} pts`;
  renderRewards(points);
}

function renderRewards(points) {
  const container = $('rewardList');
  if (!container) return;
  container.innerHTML = demoRewards.map((reward) => {
    const canRedeem = points >= reward.pointsRequired;
    return `
      <div class="reward-card panel">
        <div class="reward-thumb">${reward.imageUrl ? `<img src="${escapeHtml(reward.imageUrl)}" alt="${escapeHtml(reward.title)}" />` : '<div class="reward-thumb-placeholder">Reward</div>'}</div>
        <div class="reward-info">
          <div class="eyebrow gold">${escapeHtml(reward.outlet || 'Reward')}</div>
          <h3>${escapeHtml(reward.title)}</h3>
          <p>${escapeHtml(reward.summary || '')}</p>
          <div class="reward-meta">${formatNumber(reward.pointsRequired)} point(s)</div>
        </div>
        <div class="reward-action">
          <button type="button" class="${canRedeem ? 'secondary-btn' : 'ghost-btn'} reward-redeem-btn" data-reward-id="${escapeHtml(reward.id)}" ${canRedeem ? '' : 'disabled'}>${canRedeem ? 'Redeem' : 'Need more points'}</button>
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
