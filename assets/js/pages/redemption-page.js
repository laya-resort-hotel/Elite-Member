
import { state } from '../core/state.js?v=20260404residentredemptionfix3';
import { $ } from '../core/dom.js?v=20260404residentredemptionfix3';
import { escapeHtml, formatNumber } from '../core/format.js?v=20260404residentredemptionfix3';
import { renderResidentCard } from '../ui/renderers.js?v=20260404residentredemptionfix3';
import { showToast } from '../ui/toast.js?v=20260404residentredemptionfix3';
import { loadCollectionSafe } from '../services/content-service.js?v=20260404residentredemptionfix3';
import { redeemReward } from '../services/redemption-service.js?v=20260404residentredemptionfix3';
import { demoRewards } from '../data/rewards.js?v=20260404residentmemberfix1';
import { loadResidentForUser } from '../services/member-service.js?v=20260404residentmemberfix1';

function emptyResident() {
  return {
    fullName: 'Resident Member',
    tier: 'Elite Black',
    status: 'INACTIVE',
    residence: '-',
    memberCode: '-',
    publicCardCode: '-',
    points: 0,
    totalSpend: 0,
  };
}

async function resolveResidentForRedemptionPage() {
  if (state.currentResident) return state.currentResident;

  const uid = state.currentUser?.uid || '';
  const email = state.currentUser?.email || '';
  if (uid) {
    try {
      const resident = await loadResidentForUser(uid, email, {
        residentId: state.residentId || '',
        memberCode: state.memberCode || '',
        publicCardCode: state.memberCode || '',
      });
      if (resident) {
        state.currentResident = resident;
        state.residentId = resident.residentId || state.residentId || '';
        state.memberCode = resident.memberCode || resident.publicCardCode || state.memberCode || '';
        return resident;
      }
    } catch (error) {
      console.warn('redemption resident retry failed', error);
    }
  }

  const emailPrefix = String(email || '').trim().split('@')[0] || '';
  const guessedName = state.currentUser?.displayName?.trim() || emailPrefix || 'Resident Member';
  return {
    ...emptyResident(),
    fullName: guessedName,
    displayName: guessedName,
    email,
    status: state.currentUser ? 'ACTIVE' : 'INACTIVE',
  };
}

export async function loadRedemptionPage() {
  const resident = await resolveResidentForRedemptionPage();
  renderResidentCard(resident);
  const points = Number(resident.points || 0);
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(points);

  try {
    const rewardItems = await loadCollectionSafe('reward_catalog', { limit: 100, publishedOnly: true });
    const fallbackBenefits = rewardItems.length ? [] : await loadCollectionSafe('benefits', { limit: 100, publishedOnly: true });
    const rewards = (rewardItems.length ? rewardItems : fallbackBenefits)
      .filter((item) => item.isActive !== false && Number(item.pointsCost || 0) > 0)
      .sort((a, b) => Number(a.pointsCost || 0) - Number(b.pointsCost || 0));
    renderRewards(rewards, points);
  } catch (error) {
    console.error(error);
    renderRewards([], points, { useDemoFallback: true });
    showToast('อ่าน rewards จาก Firebase ไม่สำเร็จ', 'error');
  }
}

let currentRewardItems = [];
let currentPointsBalance = 0;

function renderRewards(rewards = [], points, options = {}) {
  const container = $('rewardList');
  if (!container) return;
  const list = rewards.length ? rewards : (options.useDemoFallback ? demoRewards : []);
  currentRewardItems = Array.isArray(list) ? list.map((item) => ({ ...item })) : [];
  currentPointsBalance = Number(points || 0);
  if (!list.length) {
    container.innerHTML = '<div class="card-item"><p>No rewards available</p></div>';
    return;
  }
container.innerHTML = list.map((reward) => {
    const pointsRequired = Number(reward.pointsCost || reward.pointsRequired || 0);
    const stockTotal = Number(reward.stockTotal || 0);
    const stockRemaining = reward.stockRemaining == null ? (stockTotal > 0 ? stockTotal : null) : Number(reward.stockRemaining || 0);
    const isStockAvailable = stockTotal === 0 || stockRemaining > 0;
    const isRewardActive = reward.rewardIsActive !== false;
    const canRedeem = points >= pointsRequired && pointsRequired > 0 && isStockAvailable && isRewardActive;
    const imageUrl = reward.coverImageUrl || reward.imageUrl || reward.galleryImages?.[0]?.url || '';
    const title = reward.title || 'Reward';
    const category = reward.rewardCategory || reward.category || '';
    const statusHint = !isRewardActive
      ? 'Reward paused'
      : !isStockAvailable
        ? 'Out of stock'
        : canRedeem
          ? 'Ready to redeem'
          : `Need ${formatNumber(Math.max(pointsRequired - points, 0))} more points`;
    const stockLabel = stockTotal > 0 ? `${formatNumber(stockRemaining)} left` : 'Unlimited';
    const buttonLabel = !isRewardActive ? 'Inactive' : !isStockAvailable ? 'Out of stock' : 'Redeem';
    return `
      <div class="reward-card vault-reward-card">
        <div class="reward-thumb vault-reward-thumb">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />` : '<div class="reward-thumb-placeholder">Reward</div>'}</div>
        <div class="reward-info vault-reward-info">
          <h3>${escapeHtml(title)}</h3>
          <div class="reward-meta vault-points-text">${formatNumber(pointsRequired)} Point(s)</div>
          <div class="vault-reward-hint">${escapeHtml(statusHint)}</div>
          <div class="vault-reward-hint">${escapeHtml(category ? `${category} • ${stockLabel}` : stockLabel)}</div>
        </div>
        <div class="reward-action vault-reward-action">
          <button type="button" class="vault-redeem-btn ${canRedeem ? 'ready' : 'disabled'}" data-reward-id="${escapeHtml(reward.id || '')}" ${canRedeem && reward.id ? '' : 'disabled'}>${escapeHtml(buttonLabel)}</button>
        </div>
      </div>
    `;
  }).join('');
  container.querySelectorAll('[data-reward-id]').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const rewardId = btn.dataset.rewardId || '';
      if (!rewardId) return;
      try {
        btn.disabled = true;
        btn.textContent = 'Redeeming...';
        const result = await redeemReward(rewardId);
        currentPointsBalance = Number(result.balanceAfter || 0);
        if ($('memberPoints')) $('memberPoints').textContent = formatNumber(currentPointsBalance);
        currentRewardItems = currentRewardItems.map((item) => item.id === rewardId
          ? { ...item, stockRemaining: result.reward.stockRemaining }
          : item);
        renderRewards(currentRewardItems, currentPointsBalance);
        showToast('Redeemed successfully', 'success');
      } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.textContent = 'Redeem';
        showToast(error?.message || 'Redeem failed', 'error');
      }
    });
  });
}
