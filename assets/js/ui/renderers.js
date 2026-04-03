
import { $, $$ } from '../core/dom.js';
import { escapeHtml, formatDate, formatNumber, formatTHB } from '../core/format.js';

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

export function renderResidentCard(resident) {
  if ($('memberName')) $('memberName').textContent = resident.fullName || 'Resident Member';
  if ($('memberTier')) $('memberTier').textContent = resident.tier || 'Elite Black';
  if ($('memberStatusPill')) $('memberStatusPill').textContent = resident.status || 'ACTIVE';
  if ($('memberCode')) $('memberCode').textContent = resident.memberCode || 'LAYA-0001';
  if ($('memberResidence')) $('memberResidence').textContent = resident.residence || '-';
  if ($('memberPoints')) $('memberPoints').textContent = formatNumber(resident.points || 0);
  if ($('memberSpend')) $('memberSpend').textContent = formatTHB(resident.totalSpend || 0);
  renderQr(resident.memberCode || 'LAYA-0001');
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
      <br>${escapeHtml(resident.residence || '')}</p>
    </div>
  `).join('');
}

export function renderAdminKpis({ residents = 0, points = 0, spend = 0 }) {
  if ($('kpiResidents')) $('kpiResidents').textContent = formatNumber(residents);
  if ($('kpiPoints')) $('kpiPoints').textContent = formatNumber(points);
  if ($('kpiSpend')) $('kpiSpend').textContent = formatTHB(spend);
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
