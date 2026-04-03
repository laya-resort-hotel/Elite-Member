import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoResident } from '../data/demo.js';
import { demoRewards } from '../data/rewards.js';
import { escapeHtml, formatNumber } from '../core/format.js';
import { renderResidentCard } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';

export function loadRedemptionPage() {
  const resident = state.currentResident || demoResident;
  renderResidentCard(resident);
  const points = Number(resident.points || 0);
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(points);
  renderRewards(points);
}

function renderRewards(points) {
  const container = $('rewardList');
  if (!container) return;
  container.innerHTML = demoRewards.map((reward) => {
    const canRedeem = points >= reward.pointsRequired;
    return `
      <div class="reward-card vault-reward-card">
        <div class="reward-thumb vault-reward-thumb">${reward.imageUrl ? `<img src="${escapeHtml(reward.imageUrl)}" alt="${escapeHtml(reward.title)}" />` : '<div class="reward-thumb-placeholder">Reward</div>'}</div>
        <div class="reward-info vault-reward-info">
          <h3>${escapeHtml(reward.title)}</h3>
          <div class="reward-meta vault-points-text">${formatNumber(reward.pointsRequired)} Point(s)</div>
        </div>
        <div class="reward-action vault-reward-action">
          <button type="button" class="vault-redeem-btn ${canRedeem ? 'ready' : 'disabled'}" data-reward-id="${escapeHtml(reward.id)}" ${canRedeem ? '' : 'disabled'}>Redeem</button>
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
