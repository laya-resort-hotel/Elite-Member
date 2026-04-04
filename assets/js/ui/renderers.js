import { $, $$ } from '../core/dom.js';
import { escapeHtml, formatDate, formatNumber, formatTHB } from '../core/format.js';

function setAllById(id, value) {
  document.querySelectorAll(`[id="${id}"]`).forEach((node) => {
    node.textContent = value;
  });
}

export function updateStatusLabels({ firebaseState, authState, modeState }) {
  if (firebaseState !== undefined && $('firebaseState')) $('firebaseState').textContent = firebaseState;
  if (authState !== undefined && $('authState')) $('authState').textContent = authState;
  if (modeState !== undefined && $('modeState')) $('modeState').textContent = modeState;
}

export function renderCards(listEl, items = [], emptyText = 'No data') {
  if (!listEl) return;
  if (!items.length) {
    listEl.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }
  listEl.innerHTML = items.map((item) => `
    <div class="card-item">
      <h4>${escapeHtml(item.title || item.outlet || '-')}</h4>
      <p>${escapeHtml(item.body || item.description || '')}</p>
      ${item.createdLabel ? `<small>${escapeHtml(item.createdLabel)}</small>` : ''}
    </div>
  `).join('');
}

function buildContentDetailHref(type, item, fallbackHref) {
  const id = String(item?.id || '').trim();
  return id ? `./${type}-detail.html?id=${encodeURIComponent(id)}` : fallbackHref;
}

export function renderVaultHome(newsItem, promotionItems = []) {
  const hero = $('homeNewsHero');
  if (hero) {
    const image = newsItem?.coverImageUrl || newsItem?.galleryImages?.[0]?.url || '';
    const newsHref = buildContentDetailHref('news', newsItem, './news.html');
    hero.innerHTML = `
      <a class="vault-news-hero-link" href="${newsHref}">
        <div class="vault-news-image-wrap vault-news-frame">
          ${image ? `<img class="vault-news-image" src="${escapeHtml(image)}" alt="${escapeHtml(newsItem?.title || 'News')}" />` : '<div class="vault-news-image vault-news-fallback">News</div>'}
        </div>
      </a>
    `;
  }

  const promoGrid = $('homePromotionGrid');
  if (promoGrid) {
    const items = promotionItems.slice(0, 3);
    promoGrid.innerHTML = items.map((item) => {
      const image = item.coverImageUrl || item.galleryImages?.[0]?.url || '';
      const promoHref = buildContentDetailHref('promotions', item, './promotions.html');
      return `
        <a class="vault-promo-card image-only" href="${promoHref}" aria-label="${escapeHtml(item.title || 'Promotion')}">
          <div class="vault-promo-thumb-wrap">
            ${image ? `<img class="vault-promo-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(item.title || 'Promotion')}" />` : '<div class="vault-promo-thumb vault-news-fallback">Promo</div>'}
          </div>
        </a>
      `;
    }).join('');
  }
}

export function renderTable(container, rows = [], emptyText = 'No transactions yet') {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Member</th>
            <th>Outlet</th>
            <th>Amount</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.createdLabel || formatDate(row.createdAt))}</td>
              <td>${escapeHtml(row.memberName || row.fullName || '')}<br><small>${escapeHtml(row.memberCode || '')}</small></td>
              <td>${escapeHtml(row.outlet || '-')}</td>
              <td>${formatTHB(row.amount || 0)}</td>
              <td>${formatNumber(row.points || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderResidentCard(resident = {}) {
  const fullName = resident.fullName || resident.displayName || 'Resident Member';
  const initials = fullName.trim().charAt(0).toUpperCase() || 'R';
  const qrCode = resident.qrCodeValue || resident.publicCardCode || resident.memberCode || resident.memberId || 'LAYA-0001';
  const currentPoints = formatNumber(resident.points || 0);

  setAllById('memberName', fullName);
  setAllById('memberTier', resident.tier || 'Elite Black');
  setAllById('memberStatusPill', resident.status || 'ACTIVE');
  setAllById('memberCode', resident.memberCode || qrCode);
  setAllById('memberResidence', resident.residence || '-');
  setAllById('memberPoints', currentPoints);
  setAllById('memberSpend', formatTHB(resident.totalSpend || 0));
  setAllById('memberQrCodeText', qrCode);
  setAllById('memberCardNumber', resident.cardNumber || '-');
  setAllById('memberLoginEmail', resident.email || resident.contactEmail || '-');
  setAllById('memberPendingPoints', formatNumber(resident.pendingPoints || 0));
  setAllById('memberLifetimeEarned', formatNumber(resident.lifetimeEarned || 0));
  setAllById('memberLifetimeRedeemed', formatNumber(resident.lifetimeRedeemed || 0));

  if ($('memberAvatarLetter')) $('memberAvatarLetter').textContent = initials;
  if ($('vaultMemberName')) $('vaultMemberName').textContent = fullName;
  renderQr(qrCode);
}

export function renderResidentSearchResults(container, residents = []) {
  if (!container) return;
  if (!residents.length) {
    container.innerHTML = '<div class="card-item"><p>No matching residents</p></div>';
    return;
  }
  container.innerHTML = residents.map((resident) => `
    <div class="card-item">
      <h4>${escapeHtml(resident.fullName || resident.memberName || '-')}</h4>
      <p>${escapeHtml(resident.memberCode || '-')}
      <br>${escapeHtml(resident.email || '')}
      <br>${escapeHtml(resident.residence || '')}
      <br><small>${escapeHtml(resident.cardNumber || resident.qrCodeValue || '')}</small></p>
    </div>
  `).join('');
}

export function renderAdminKpis({ residents = 0, points = 0, spend = 0 }) {
  if ($('kpiResidents')) $('kpiResidents').textContent = formatNumber(residents);
  if ($('kpiPoints')) $('kpiPoints').textContent = formatNumber(points);
  if ($('kpiSpend')) $('kpiSpend').textContent = formatTHB(spend);
}

export function renderResidentPointHistoryMini(container, rows = [], emptyText = 'No point history yet') {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }

  container.innerHTML = rows.map((row) => {
    const delta = Number(row.pointsDelta || 0);
    const sign = delta > 0 ? '+' : '';
    return `
      <div class="card-item">
        <div class="row space-between gap">
          <div>
            <strong>${escapeHtml(row.type || 'transaction')}</strong>
            <p>${escapeHtml(row.source || '-')} · ${escapeHtml(row.referenceNo || '-')}</p>
            ${row.note ? `<small>${escapeHtml(row.note)}</small>` : ''}
          </div>
          <div class="text-right">
            <strong class="${delta < 0 ? 'text-danger' : 'text-gold'}">${sign}${formatNumber(delta)}</strong>
            <p><small>${escapeHtml(formatDate(row.createdAt))}</small></p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderQr(text) {
  const canvas = $('memberQrCanvas');
  if (!canvas) return;
  if (window.QRious) {
    new window.QRious({ element: canvas, value: text, size: 124, background: 'white', foreground: '#111111' });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '12px sans-serif';
    ctx.fillText(text, 12, 70);
  }
}
