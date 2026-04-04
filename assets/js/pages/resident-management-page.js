import { state } from '../core/state.js?v=20260404fix5';
import { $, $$ } from '../core/dom.js?v=20260404fix5';
import { escapeHtml, formatDate, formatNumber } from '../core/format.js?v=20260404fix5';
import { showToast } from '../ui/toast.js?v=20260404fix5';
import {
  addResidentPointAdjustment,
  deleteResidentManagementRecord,
  loadResidentManagementDashboard,
  resetResidentManagementLocalStore,
  saveResidentManagementRecord,
} from '../services/resident-management-service.js?v=20260404starter1';

const pageState = {
  mode: 'loading',
  residents: [],
  wallets: {},
  cards: {},
  pointTransactions: [],
  selectedResidentId: null,
};

function getResidentById(residentId) {
  return pageState.residents.find((row) => row.id === residentId) || null;
}

function getSelectedResident() {
  return getResidentById(pageState.selectedResidentId) || pageState.residents[0] || null;
}

function updateModeBadge(mode) {
  pageState.mode = mode;
  const modeLabel = $('residentManagementMode');
  const note = $('residentManagementNote');
  if (modeLabel) modeLabel.textContent = mode === 'firebase' ? 'Firebase Live' : 'Demo Local';
  if (note) {
    note.textContent = mode === 'firebase'
      ? 'หน้านี้กำลังอ่านและเขียนข้อมูลจริงใน Firestore collections สำหรับ Resident Management และ sync link ไปที่ users/{uid}'
      : 'หน้านี้อยู่ในโหมด demo localStorage พร้อม mock data เพื่อเริ่มเทส flow ก่อนขึ้น Firebase';
  }
}

function renderMetrics(snapshot) {
  if ($('rmTotalResidents')) $('rmTotalResidents').textContent = formatNumber(snapshot.metrics?.totalResidents || 0);
  if ($('rmActiveResidents')) $('rmActiveResidents').textContent = formatNumber(snapshot.metrics?.activeResidents || 0);
  if ($('rmTotalPoints')) $('rmTotalPoints').textContent = formatNumber(snapshot.metrics?.totalPoints || 0);
  if ($('rmActiveCards')) $('rmActiveCards').textContent = formatNumber(snapshot.metrics?.activeCards || 0);
}

function collectFilters() {
  return {
    query: $('residentSearchInput')?.value.trim().toLowerCase() || '',
    status: $('residentStatusFilter')?.value || 'all',
  };
}

function filteredResidents() {
  const filters = collectFilters();
  return pageState.residents.filter((row) => {
    const matchesQuery = !filters.query || [row.displayName, row.memberCode, row.email, row.loginEmail, row.primaryUnitCode, row.qrCodeValue, row.linkedUserUid]
      .some((field) => String(field || '').toLowerCase().includes(filters.query));
    const matchesStatus = filters.status === 'all' || row.status === filters.status;
    return matchesQuery && matchesStatus;
  });
}

function renderResidentList() {
  const list = $('residentManagementList');
  if (!list) return;
  const rows = filteredResidents();
  if (!rows.length) {
    list.innerHTML = '<div class="card-item"><p>No residents found</p></div>';
    return;
  }

  list.innerHTML = rows.map((row) => `
    <button class="resident-list-card ${row.id === pageState.selectedResidentId ? 'active' : ''}" data-resident-id="${escapeHtml(row.id)}" type="button">
      <div class="resident-list-main">
        <strong>${escapeHtml(row.displayName || 'Resident')}</strong>
        <span>${escapeHtml(row.memberCode || '-')}</span>
      </div>
      <div class="resident-list-sub">${escapeHtml(row.primaryUnitCode || '-')} · ${escapeHtml(row.loginEmail || row.email || '-')}</div>
      <div class="resident-list-meta">
        <span class="mini-badge gold">${escapeHtml(row.tier || 'elite_black')}</span>
        <span class="mini-badge ${row.status === 'active' ? 'subtle' : ''}">${escapeHtml(row.status || 'active')}</span>
        <span class="mini-badge">${formatNumber(row.wallet?.currentPoints || 0)} pts</span>
      </div>
    </button>
  `).join('');

  $$('[data-resident-id]').forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      pageState.selectedResidentId = button.dataset.residentId || null;
      renderResidentList();
      renderSelectedResident();
    });
  });
}

function setFormValues(resident) {
  $('residentIdInput').value = resident?.id || '';
  $('residentMemberCodeInput').value = resident?.memberCode || '';
  $('residentCardNumberInput').value = resident?.cardNumber || '';
  $('residentQrValueInput').value = resident?.qrCodeValue || '';
  $('residentDisplayNameInput').value = resident?.displayName || '';
  $('residentFirstNameInput').value = resident?.firstName || '';
  $('residentLastNameInput').value = resident?.lastName || '';
  $('residentEmailInput').value = resident?.email || '';
  $('residentLoginEmailInput').value = resident?.loginEmail || resident?.email || '';
  $('residentLinkedUidInput').value = resident?.linkedUserUid || resident?.authUid || '';
  $('residentPhoneInput').value = resident?.phone || '';
  $('residentStatusInput').value = resident?.status || 'active';
  $('residentTierInput').value = resident?.tier || 'elite_black';
  $('residentOwnerTypeInput').value = resident?.ownerType || 'resident_owner';
  $('residentPrimaryUnitInput').value = resident?.primaryUnitCode || '';
  $('residentUnitsInput').value = Array.isArray(resident?.unitCodes) ? resident.unitCodes.join('\n') : '';
  $('residentNotesInput').value = resident?.notes || '';
}

function renderQr(value) {
  const canvas = $('residentQrCanvas');
  if (!canvas) return;
  const safeValue = value || 'LAYA-RES-NEW';
  if (window.QRious) {
    const qr = new window.QRious({
      element: canvas,
      size: 180,
      value: safeValue,
      foreground: '#f1d38b',
      background: '#101216',
      level: 'H',
    });
    qr.set({ value: safeValue });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f1d38b';
    ctx.font = '14px sans-serif';
    ctx.fillText('QR unavailable', 26, 88);
  }
}

function renderPointHistory(residentId) {
  const box = $('residentPointHistory');
  if (!box) return;
  const rows = pageState.pointTransactions.filter((item) => item.residentId === residentId);
  if (!rows.length) {
    box.innerHTML = '<div class="card-item"><p>No point history yet</p></div>';
    return;
  }
  box.innerHTML = `
    <div class="table-wrap">
      <table class="table compact-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Points</th>
            <th>Balance</th>
            <th>Ref</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(formatDate(row.createdAt))}</td>
              <td>${escapeHtml(row.type || '-')}<br><small>${escapeHtml(row.source || '-')}</small></td>
              <td class="${Number(row.pointsDelta || 0) < 0 ? 'text-danger' : 'text-gold'}">${formatNumber(row.pointsDelta || 0)}</td>
              <td>${formatNumber(row.balanceAfter || 0)}</td>
              <td>${escapeHtml(row.referenceNo || '-')}${row.note ? `<br><small>${escapeHtml(row.note)}</small>` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSelectedResident() {
  const resident = getSelectedResident();
  if (!resident) {
    setFormValues(null);
    return;
  }
  setFormValues(resident);
  $('residentCardPreviewName').textContent = resident.displayName || 'Resident Member';
  $('residentCardPreviewCode').textContent = resident.memberCode || '-';
  $('residentCardPreviewUnit').textContent = resident.primaryUnitCode || '-';
  $('residentCardPreviewTier').textContent = resident.tier || 'elite_black';
  $('residentCardPreviewStatus').textContent = resident.status || 'active';
  $('residentCardPreviewOwner').textContent = resident.ownerType || 'resident_owner';
  if ($('residentLinkedLoginPreview')) $('residentLinkedLoginPreview').textContent = resident.loginEmail || resident.email || '-';
  if ($('residentLinkedUidPreview')) $('residentLinkedUidPreview').textContent = resident.linkedUserUid || resident.authUid || '-';
  $('residentWalletCurrent').textContent = formatNumber(resident.wallet?.currentPoints || 0);
  $('residentWalletPending').textContent = formatNumber(resident.wallet?.pendingPoints || 0);
  $('residentWalletEarned').textContent = formatNumber(resident.wallet?.lifetimeEarned || 0);
  $('residentWalletRedeemed').textContent = formatNumber(resident.wallet?.lifetimeRedeemed || 0);
  $('residentWalletUpdated').textContent = resident.wallet?.updatedAt ? `Updated ${formatDate(resident.wallet.updatedAt)}` : 'No wallet data yet';
  $('residentQrText').textContent = resident.qrCodeValue || '-';
  $('residentUnitsSummary').textContent = Array.isArray(resident.unitCodes) && resident.unitCodes.length ? resident.unitCodes.join(', ') : '-';
  renderQr(resident.qrCodeValue || resident.memberCode || 'LAYA-RES-NEW');
  renderPointHistory(resident.id);
}

function refreshSnapshot(snapshot) {
  pageState.residents = snapshot.residents || [];
  pageState.wallets = snapshot.wallets || {};
  pageState.cards = snapshot.cards || {};
  pageState.pointTransactions = snapshot.pointTransactions || [];
  updateModeBadge(snapshot.mode || 'demo');
  renderMetrics(snapshot);

  const selectedStillExists = pageState.selectedResidentId && getResidentById(pageState.selectedResidentId);
  if (!selectedStillExists) {
    pageState.selectedResidentId = pageState.residents[0]?.id || null;
  }
  renderResidentList();
  renderSelectedResident();
}

function collectResidentFormPayload() {
  return {
    id: $('residentIdInput')?.value.trim() || '',
    memberCode: $('residentMemberCodeInput')?.value.trim() || '',
    cardNumber: $('residentCardNumberInput')?.value.trim() || '',
    qrCodeValue: $('residentQrValueInput')?.value.trim() || '',
    displayName: $('residentDisplayNameInput')?.value.trim() || '',
    firstName: $('residentFirstNameInput')?.value.trim() || '',
    lastName: $('residentLastNameInput')?.value.trim() || '',
    email: $('residentEmailInput')?.value.trim() || '',
    loginEmail: $('residentLoginEmailInput')?.value.trim() || '',
    linkedUserUid: $('residentLinkedUidInput')?.value.trim() || '',
    phone: $('residentPhoneInput')?.value.trim() || '',
    status: $('residentStatusInput')?.value || 'active',
    tier: $('residentTierInput')?.value || 'elite_black',
    ownerType: $('residentOwnerTypeInput')?.value || 'resident_owner',
    primaryUnitCode: $('residentPrimaryUnitInput')?.value.trim() || '',
    unitCodesText: $('residentUnitsInput')?.value || '',
    notes: $('residentNotesInput')?.value || '',
  };
}

async function handleSaveResident() {
  try {
    const payload = collectResidentFormPayload();
    if (!payload.displayName && !(payload.firstName || payload.lastName)) {
      throw new Error('Please enter resident name');
    }
    const snapshot = await saveResidentManagementRecord(payload);
    pageState.selectedResidentId = payload.id
      || snapshot.residents.find((row) => row.memberCode === (payload.memberCode || row.memberCode) && row.displayName === (payload.displayName || row.displayName))?.id
      || snapshot.residents.find((row) => row.displayName === (payload.displayName || row.displayName))?.id
      || pageState.selectedResidentId;
    refreshSnapshot(snapshot);
    showToast('Resident saved successfully', 'success');
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Save resident failed', 'error');
  }
}

async function handleDeleteResident() {
  const resident = getSelectedResident();
  if (!resident) {
    showToast('No resident selected', 'error');
    return;
  }
  const confirmed = window.confirm(`Delete ${resident.displayName}? This will remove wallet, card and point history for this starter module.`);
  if (!confirmed) return;
  try {
    const snapshot = await deleteResidentManagementRecord(resident.id);
    pageState.selectedResidentId = snapshot.residents[0]?.id || null;
    refreshSnapshot(snapshot);
    showToast('Resident deleted', 'success');
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Delete resident failed', 'error');
  }
}

async function handlePointAdjustment() {
  const resident = getSelectedResident();
  if (!resident) {
    showToast('Select resident first', 'error');
    return;
  }
  try {
    const payload = {
      residentId: resident.id,
      type: $('pointActionType')?.value || 'earn',
      points: Number($('pointActionAmount')?.value || 0),
      source: $('pointActionSource')?.value.trim() || 'manual_adjustment',
      referenceNo: $('pointActionReference')?.value.trim() || '',
      note: $('pointActionNote')?.value.trim() || '',
      createdByName: state.currentUser?.email || 'Admin',
    };
    if (!payload.points) throw new Error('Please enter points');
    const snapshot = await addResidentPointAdjustment(payload);
    pageState.selectedResidentId = resident.id;
    refreshSnapshot(snapshot);
    $('pointActionAmount').value = '';
    $('pointActionReference').value = '';
    $('pointActionNote').value = '';
    showToast('Point history updated', 'success');
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Point update failed', 'error');
  }
}

function handleNewResident() {
  pageState.selectedResidentId = null;
  renderResidentList();
  setFormValues({
    status: 'active',
    tier: 'elite_black',
    ownerType: 'resident_owner',
  });
  $('residentCardPreviewName').textContent = 'New resident';
  $('residentCardPreviewCode').textContent = 'Auto-generated after save';
  $('residentCardPreviewUnit').textContent = '-';
  $('residentCardPreviewTier').textContent = 'elite_black';
  $('residentCardPreviewStatus').textContent = 'active';
  $('residentCardPreviewOwner').textContent = 'resident_owner';
  if ($('residentLinkedLoginPreview')) $('residentLinkedLoginPreview').textContent = '-';
  if ($('residentLinkedUidPreview')) $('residentLinkedUidPreview').textContent = '-';
  $('residentWalletCurrent').textContent = '0';
  $('residentWalletPending').textContent = '0';
  $('residentWalletEarned').textContent = '0';
  $('residentWalletRedeemed').textContent = '0';
  $('residentWalletUpdated').textContent = 'Wallet will be created after save';
  $('residentQrText').textContent = 'QR will be generated after save';
  $('residentUnitsSummary').textContent = '-';
  renderQr('LAYA-RES-NEW');
  $('residentPointHistory').innerHTML = '<div class="card-item"><p>Save resident first to start point history</p></div>';
}

function bindDownloadQr() {
  const button = $('downloadResidentQrBtn');
  if (!button || button.dataset.bound) return;
  button.dataset.bound = '1';
  button.addEventListener('click', () => {
    const resident = getSelectedResident();
    if (!resident) {
      showToast('No resident selected', 'error');
      return;
    }
    const canvas = $('residentQrCanvas');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${resident.memberCode || 'resident'}-qr.png`;
    link.click();
  });
}

function bindCopyQr() {
  const button = $('copyResidentQrBtn');
  if (!button || button.dataset.bound) return;
  button.dataset.bound = '1';
  button.addEventListener('click', async () => {
    const value = $('residentQrText')?.textContent || '';
    if (!value || value === '-') {
      showToast('No QR value yet', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast('QR value copied', 'success');
    } catch (error) {
      console.error(error);
      showToast('Copy failed', 'error');
    }
  });
}

export function bindResidentManagementPage() {
  $('saveResidentManagementBtn')?.addEventListener('click', handleSaveResident);
  $('deleteResidentManagementBtn')?.addEventListener('click', handleDeleteResident);
  $('newResidentManagementBtn')?.addEventListener('click', handleNewResident);
  $('applyPointActionBtn')?.addEventListener('click', handlePointAdjustment);
  $('reloadResidentManagementBtn')?.addEventListener('click', loadResidentManagementPage);
  $('seedResidentDemoBtn')?.addEventListener('click', () => {
    const snapshot = resetResidentManagementLocalStore();
    pageState.selectedResidentId = snapshot.residents[0]?.id || null;
    refreshSnapshot({ ...snapshot, mode: 'demo' });
    showToast('Demo seed loaded into local storage', 'success');
  });
  $('residentSearchInput')?.addEventListener('input', renderResidentList);
  $('residentStatusFilter')?.addEventListener('change', renderResidentList);
  bindDownloadQr();
  bindCopyQr();
}

export async function loadResidentManagementPage() {
  try {
    const snapshot = await loadResidentManagementDashboard();
    refreshSnapshot(snapshot);
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Load resident management failed', 'error');
  }
}
