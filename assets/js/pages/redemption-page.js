import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { escapeHtml, formatDate, formatNumber } from '../core/format.js';
import { renderResidentCard } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';
import { loadCollectionSafe } from '../services/content-service.js';
import {
  loadResidentRedemptions,
  redeemReward,
  splitResidentRedemptions,
} from '../services/redemption-service.js';
import { demoRewards } from '../data/rewards.js';
import { loadResidentForUser, loadUserProfile } from '../services/member-service.js';

const pageState = {
  activeTab: 'for-you',
  rewards: [],
  residentRedemptions: [],
  currentPoints: 0,
};

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

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveResidentForRedemptionPage() {
  const authUser = state.currentUser || state.auth?.currentUser || null;
  if (authUser && !state.currentUser) state.currentUser = authUser;
  const uid = authUser?.uid || '';
  const email = authUser?.email || '';
  const existingResident = state.currentResident || null;
  let profile = state.currentProfile || {};

  if (uid && (!profile || Object.keys(profile).length === 0)) {
    try {
      profile = await loadUserProfile(uid, email);
      state.currentProfile = profile || {};
    } catch (error) {
      console.warn('redemption user profile retry failed', error);
    }
  }

  const residentLookup = {
    residentId: profile?.residentId || profile?.memberId || existingResident?.residentId || existingResident?.memberId || state.residentId || '',
    memberId: profile?.memberId || existingResident?.memberId || existingResident?.residentId || state.residentId || '',
    memberCode: profile?.memberCode || profile?.publicCardCode || existingResident?.memberCode || existingResident?.publicCardCode || existingResident?.memberId || state.memberCode || '',
    publicCardCode: profile?.publicCardCode || profile?.memberCode || existingResident?.publicCardCode || existingResident?.memberCode || state.memberCode || '',
  };

  state.residentId = residentLookup.residentId || state.residentId || '';
  state.memberCode = residentLookup.publicCardCode || residentLookup.memberCode || state.memberCode || '';

  if (uid) {
    try {
      const resident = await loadResidentForUser(uid, email, residentLookup);
      if (resident) {
        state.currentResident = resident;
        state.residentId = resident.residentId || resident.memberId || residentLookup.residentId || '';
        state.memberCode = resident.memberCode || resident.publicCardCode || resident.memberId || residentLookup.memberCode || '';
        return resident;
      }
    } catch (error) {
      console.warn('redemption resident retry failed', error);
    }
  }

  if (existingResident?.residentId || existingResident?.memberId || existingResident?.id) {
    return existingResident;
  }

  const emailPrefix = String(email || '').trim().split('@')[0] || '';
  const guessedName = authUser?.displayName?.trim() || profile?.displayName || emailPrefix || 'Resident Member';
  return {
    ...emptyResident(),
    fullName: guessedName,
    displayName: guessedName,
    email: email || profile?.email || '',
    memberCode: residentLookup.memberCode || residentLookup.publicCardCode || '-',
    publicCardCode: residentLookup.publicCardCode || residentLookup.memberCode || '-',
    status: authUser ? 'ACTIVE' : 'INACTIVE',
  };
}

function renderTabs() {
  document.querySelectorAll('.vault-reward-tab').forEach((button) => {
    const tabKey = button.dataset.tab || 'for-you';
    button.classList.toggle('active', tabKey === pageState.activeTab);
  });

  const titleMap = {
    'for-you': 'Reward',
    'your-rewards': 'Your Rewards',
    used: 'Used Rewards',
    expired: 'Expired Rewards',
  };
  if ($('rewardGroupTitleText')) $('rewardGroupTitleText').textContent = titleMap[pageState.activeTab] || 'Reward';
}

function buildRewardQrText(row = {}) {
  return String(row.redemptionCode || '').trim().toUpperCase();
}

function renderRewardQRCodes(scope = document) {
  const nodes = scope.querySelectorAll('[data-redemption-qr]');
  if (!nodes.length) return;
  const QRiousCtor = window.QRious;
  nodes.forEach((canvas) => {
    if (canvas.dataset.rendered === '1') return;
    const value = String(canvas.dataset.redemptionQr || '').trim();
    if (!value) return;
    if (QRiousCtor) {
      try {
        new QRiousCtor({
          element: canvas,
          value,
          size: Number(canvas.dataset.qrSize || 108),
          level: 'M',
          foreground: '#111111',
          background: '#ffffff',
          padding: 10,
        });
        canvas.dataset.rendered = '1';
        return;
      } catch (error) {
        console.warn('Reward QR render failed', error);
      }
    }
    const fallback = canvas.parentElement?.querySelector('.vault-issued-card__qr-fallback');
    if (fallback) fallback.classList.remove('hidden');
  });
}

function rewardStatusMessage(pointsRequired, points) {
  return `Need ${formatNumber(Math.max(pointsRequired - points, 0))} more points`;
}

function renderRewardCatalog(rewards = [], points = 0) {
  const container = $('rewardList');
  if (!container) return;
  const list = rewards.length ? rewards : demoRewards;
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
          : rewardStatusMessage(pointsRequired, points);
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
        pageState.currentPoints = Number(result.balanceAfter || 0);
        if (state.currentResident) state.currentResident.points = pageState.currentPoints;
        if ($('memberPoints')) $('memberPoints').textContent = formatNumber(pageState.currentPoints);
        pageState.rewards = pageState.rewards.map((item) => item.id === rewardId
          ? { ...item, stockRemaining: result.reward.stockRemaining }
          : item);
        pageState.residentRedemptions = await loadResidentRedemptions(state.currentResident?.residentId || state.residentId || '');
        pageState.activeTab = 'your-rewards';
        renderCurrentTab();
        showToast(`Reward code ${result.redemptionCode} created`, 'success');
      } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.textContent = 'Redeem';
        showToast(error?.message || 'Redeem failed', 'error');
      }
    });
  });
}

function buildIssuedCard(row) {
  const usedBy = row.usedByName || row.usedByEmail || row.usedOutlet || '';
  const footer = row.status === 'used'
    ? `Used ${formatDate(row.usedAt)}${usedBy ? ` • ${usedBy}` : ''}`
    : row.status === 'expired'
      ? `Expired ${formatDate(row.expiresAt)}`
      : `Valid until ${formatDate(row.expiresAt)}`;
  const qrValue = buildRewardQrText(row);
  const actionButton = row.status === 'issued'
    ? `<button type="button" class="vault-code-copy-btn" data-copy-code="${escapeHtml(row.redemptionCode || '')}">Copy code</button>`
    : `<span class="vault-code-status vault-code-status-${escapeHtml(row.status || 'issued')}">${escapeHtml(String(row.status || 'issued').toUpperCase())}</span>`;
  const qrBlock = row.status === 'issued'
    ? `<div class="vault-issued-card__qr">
         <canvas class="vault-issued-card__qr-canvas" data-redemption-qr="${escapeHtml(qrValue)}" data-qr-size="112" width="112" height="112"></canvas>
         <div class="vault-issued-card__qr-fallback hidden">${escapeHtml(qrValue)}</div>
         <div class="vault-issued-card__qr-note">Staff can scan this QR</div>
       </div>`
    : `<div class="vault-issued-card__qr vault-issued-card__qr--status">${actionButton}</div>`;
  const actionWrap = row.status === 'issued'
    ? `<div class="vault-issued-card__action">${actionButton}</div>`
    : '';
  const thumbInner = row.rewardImageUrl
    ? `<img src="${escapeHtml(row.rewardImageUrl)}" alt="${escapeHtml(row.rewardTitle)}" />`
    : '<div class="reward-thumb-placeholder">Reward</div>';
  const usedStamp = row.status === 'used'
    ? '<img class="vault-used-stamp" src="assets/images/reward-used-stamp.png" alt="Used" />'
    : '';
  return `
    <div class="vault-issued-card ${row.status === 'used' ? 'is-used' : row.status === 'expired' ? 'is-expired' : ''}">
      <div class="vault-issued-card__thumb">${thumbInner}${usedStamp}</div>
      <div class="vault-issued-card__body">
        <div class="vault-issued-card__title-row">
          <h3>${escapeHtml(row.rewardTitle || 'Reward')}</h3>
          <span class="vault-issued-card__points">${formatNumber(row.pointsCost || 0)} P</span>
        </div>
        <div class="vault-issued-card__code">${escapeHtml(row.redemptionCode || '-')}</div>
        <div class="vault-issued-card__hint">Show this QR or code to staff before billing</div>
        <div class="vault-issued-card__meta">${escapeHtml(row.rewardCategory || 'Reward')} • ${escapeHtml(footer)}</div>
      </div>
      ${qrBlock}
      ${actionWrap}
    </div>
  `;
}

function renderRedemptionGroup(rows = [], emptyText = 'No rewards here yet') {
  const container = $('rewardList');
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }
  container.innerHTML = rows.map((row) => buildIssuedCard(row)).join('');
  renderRewardQRCodes(container);
  container.querySelectorAll('[data-copy-code]').forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', async () => {
      const code = button.dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
        showToast('Reward code copied', 'success');
      } catch (_) {
        showToast(code, 'info');
      }
    });
  });
}

function renderCurrentTab() {
  renderTabs();
  const groups = splitResidentRedemptions(pageState.residentRedemptions || []);
  switch (pageState.activeTab) {
    case 'your-rewards':
      renderRedemptionGroup(groups.issued, 'No active reward codes yet');
      break;
    case 'used':
      renderRedemptionGroup(groups.used, 'No used rewards yet');
      break;
    case 'expired':
      renderRedemptionGroup(groups.expired, 'No expired rewards');
      break;
    case 'for-you':
    default:
      renderRewardCatalog(pageState.rewards, pageState.currentPoints);
      break;
  }
}

function bindTabButtons() {
  document.querySelectorAll('.vault-reward-tab').forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      pageState.activeTab = button.dataset.tab || 'for-you';
      renderCurrentTab();
    });
  });
}

export async function loadRedemptionPage() {
  bindTabButtons();
  const resident = await resolveResidentForRedemptionPage();
  renderResidentCard(resident);
  const points = Number(resident.points || 0);
  pageState.currentPoints = points;
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(points);

  try {
    const rewardItems = await loadCollectionSafe('reward_catalog', { limit: 100, publishedOnly: true });
    const fallbackBenefits = rewardItems.length ? [] : await loadCollectionSafe('benefits', { limit: 100, publishedOnly: true });
    pageState.rewards = (rewardItems.length ? rewardItems : fallbackBenefits)
      .filter((item) => item.isActive !== false && Number(item.pointsCost || 0) > 0)
      .sort((a, b) => Number(a.pointsCost || 0) - Number(b.pointsCost || 0));
  } catch (error) {
    console.error(error);
    pageState.rewards = [];
    showToast('Unable to read rewards from Firebase', 'error');
  }

  try {
    pageState.residentRedemptions = await loadResidentRedemptions(state.currentResident?.residentId || state.residentId || resident?.residentId || '');
  } catch (error) {
    console.warn(error);
    pageState.residentRedemptions = [];
  }

  renderCurrentTab();
}
