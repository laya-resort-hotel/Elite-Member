import { $, $$ } from '../core/dom.js';
import { formatDate, formatNumber, formatTHB, escapeHtml } from '../core/format.js';
import { state } from '../core/state.js';
import { showToast } from '../ui/toast.js';
import {
  POINT_RULE,
  awardResidentSpendPoints,
  calculateResidentEarnPoints,
  findResidentByScanValue,
  formatPointFormula,
  loadRecentResidentSpendTransactions,
} from '../services/resident-earn-service.js';

const pageState = {
  selectedResident: null,
  scannerStream: null,
  scanLoopHandle: 0,
  detector: null,
  detectorReady: false,
  scannerRunning: false,
  lastScanValue: '',
  lastScanAt: 0,
  recentTransactions: [],
};

function setFormulaCopy() {
  if ($('residentPointFormulaText')) $('residentPointFormulaText').textContent = `${POINT_RULE.thbPerBlock} THB = ${POINT_RULE.pointsPerBlock} points`;
  if ($('residentPointRateBadge')) $('residentPointRateBadge').textContent = `${POINT_RULE.thbPerBlock}:${POINT_RULE.pointsPerBlock}`;
}

function updateAmountPreview() {
  const amount = Number($('residentSpendAmountInput')?.value || 0);
  const points = calculateResidentEarnPoints(amount);
  if ($('residentPointPreviewText')) $('residentPointPreviewText').textContent = formatPointFormula(amount || 0);
  if ($('residentEarnedPointsInput')) $('residentEarnedPointsInput').value = String(points);
}

function setScanStatus(message = '', tone = 'info') {
  const box = $('residentScanStatus');
  if (!box) return;
  box.textContent = message || 'Ready';
  box.dataset.tone = tone;
}

function renderSelectedResident() {
  const resident = pageState.selectedResident;
  if (!resident) {
    if ($('residentSelectedCard')) $('residentSelectedCard').classList.add('is-empty');
    if ($('selectedResidentName')) $('selectedResidentName').textContent = 'No resident selected';
    if ($('selectedResidentMeta')) $('selectedResidentMeta').textContent = 'Scan QR or enter member code to load resident';
    if ($('selectedResidentPoints')) $('selectedResidentPoints').textContent = '0';
    if ($('selectedResidentEarned')) $('selectedResidentEarned').textContent = '0';
    if ($('selectedResidentSpend')) $('selectedResidentSpend').textContent = '฿0';
    if ($('selectedResidentCode')) $('selectedResidentCode').textContent = '-';
    if ($('residentRewardActionBtn')) $('residentRewardActionBtn').disabled = true;
    return;
  }

  if ($('residentSelectedCard')) $('residentSelectedCard').classList.remove('is-empty');
  if ($('selectedResidentName')) $('selectedResidentName').textContent = resident.displayName || 'Resident Member';
  if ($('selectedResidentMeta')) $('selectedResidentMeta').textContent = [resident.primaryUnitCode || '-', resident.loginEmail || '-'].join(' • ');
  if ($('selectedResidentPoints')) $('selectedResidentPoints').textContent = formatNumber(resident.currentPoints || 0);
  if ($('selectedResidentEarned')) $('selectedResidentEarned').textContent = formatNumber(resident.lifetimeEarned || 0);
  if ($('selectedResidentSpend')) $('selectedResidentSpend').textContent = formatTHB(resident.totalSpend || 0);
  if ($('selectedResidentCode')) $('selectedResidentCode').textContent = resident.memberCode || resident.qrCodeValue || '-';
  if ($('residentRewardActionBtn')) $('residentRewardActionBtn').disabled = false;
}

function resetResidentSelection() {
  pageState.selectedResident = null;
  renderSelectedResident();
}

async function resolveResident(scanValue) {
  const value = String(scanValue || '').trim();
  if (!value) throw new Error('Please scan or enter a QR / member code first');
  setScanStatus('Looking up resident...', 'info');
  const resident = await findResidentByScanValue(value);
  pageState.selectedResident = resident;
  pageState.lastScanValue = value;
  if ($('residentScanValueInput')) $('residentScanValueInput').value = value;
  renderSelectedResident();
  setScanStatus(`Linked to ${resident.displayName}`, 'success');
  showToast(`Linked ${resident.displayName}`, 'success');
  return resident;
}

async function handleResolveResident() {
  try {
    const value = $('residentScanValueInput')?.value || '';
    await resolveResident(value);
  } catch (error) {
    console.error(error);
    resetResidentSelection();
    setScanStatus(error?.message || 'Resident lookup failed', 'error');
    showToast(error?.message || 'Resident lookup failed', 'error');
  }
}

function renderRecentTransactions() {
  const box = $('residentSpendTransactionList');
  if (!box) return;
  const rows = pageState.recentTransactions || [];
  if (!rows.length) {
    box.innerHTML = '<div class="card-item"><p>No resident point transactions yet</p></div>';
    return;
  }

  box.innerHTML = rows.map((row) => `
    <article class="resident-spend-row">
      <div class="resident-spend-row__main">
        <strong>${escapeHtml(row.residentName || row.memberCode || 'Resident')}</strong>
        <span>${escapeHtml(row.primaryUnitCode || '-')} • ${escapeHtml(row.outlet || '-')}</span>
      </div>
      <div class="resident-spend-row__meta">
        <span>${formatTHB(row.spendAmount || 0)}</span>
        <strong>${formatNumber(row.pointsEarned || 0)} pts</strong>
      </div>
      <div class="resident-spend-row__sub">
        <span>${escapeHtml(formatDate(row.createdAt))}</span>
        <span>${escapeHtml(row.referenceNo || '-')}</span>
      </div>
    </article>
  `).join('');
}

async function refreshRecentTransactions() {
  try {
    pageState.recentTransactions = await loadRecentResidentSpendTransactions(18);
    renderRecentTransactions();
  } catch (error) {
    console.warn(error);
    pageState.recentTransactions = [];
    renderRecentTransactions();
  }
}

async function handleSaveSpend() {
  if (!pageState.selectedResident?.id) {
    showToast('Scan member QR first', 'error');
    return;
  }

  const amount = Number($('residentSpendAmountInput')?.value || 0);
  const outlet = $('residentSpendOutletInput')?.value.trim() || '';
  const referenceNo = $('residentSpendReferenceInput')?.value.trim() || '';
  const note = $('residentSpendNoteInput')?.value.trim() || '';

  if (!outlet) {
    showToast('Please enter outlet', 'error');
    return;
  }
  if (!amount || amount <= 0) {
    showToast('Please enter spend amount', 'error');
    return;
  }

  const button = $('residentRewardActionBtn');
  try {
    if (button) button.disabled = true;
    const result = await awardResidentSpendPoints({
      residentId: pageState.selectedResident.id,
      scanValue: pageState.lastScanValue || $('residentScanValueInput')?.value || '',
      amount,
      outlet,
      referenceNo,
      note,
    });
    pageState.selectedResident = result.resident;
    renderSelectedResident();
    await refreshRecentTransactions();
    if ($('residentSpendAmountInput')) $('residentSpendAmountInput').value = '';
    if ($('residentSpendReferenceInput')) $('residentSpendReferenceInput').value = '';
    if ($('residentSpendNoteInput')) $('residentSpendNoteInput').value = '';
    updateAmountPreview();
    setScanStatus(`Saved ${formatTHB(result.spend.amount)} and added ${formatNumber(result.spend.pointsEarned)} pts`, 'success');
    showToast(`Added ${formatNumber(result.spend.pointsEarned)} points`, 'success');
  } catch (error) {
    console.error(error);
    setScanStatus(error?.message || 'Save spend failed', 'error');
    showToast(error?.message || 'Save spend failed', 'error');
  } finally {
    if (button && pageState.selectedResident?.id) button.disabled = false;
  }
}

async function stopScanner() {
  if (pageState.scanLoopHandle) {
    cancelAnimationFrame(pageState.scanLoopHandle);
    pageState.scanLoopHandle = 0;
  }
  if (pageState.scannerStream) {
    pageState.scannerStream.getTracks().forEach((track) => track.stop());
    pageState.scannerStream = null;
  }
  const video = $('residentQrVideo');
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  pageState.scannerRunning = false;
  setScanStatus('Scanner stopped', 'info');
}

async function onDetected(value) {
  const clean = String(value || '').trim();
  if (!clean) return;
  const now = Date.now();
  if (clean === pageState.lastScanValue && now - pageState.lastScanAt < 2500) return;
  pageState.lastScanAt = now;
  pageState.lastScanValue = clean;
  if ($('residentScanValueInput')) $('residentScanValueInput').value = clean;
  await stopScanner();
  await resolveResident(clean);
}

async function scanLoop() {
  const video = $('residentQrVideo');
  if (!video || !pageState.scannerRunning || !pageState.detectorReady || !pageState.detector) return;
  try {
    const results = await pageState.detector.detect(video);
    const first = results?.[0];
    const value = first?.rawValue || '';
    if (value) {
      await onDetected(value);
      return;
    }
  } catch (error) {
    console.warn('Barcode detect failed', error);
  }
  pageState.scanLoopHandle = requestAnimationFrame(scanLoop);
}

async function ensureDetector() {
  if (pageState.detectorReady) return;
  const BarcodeDetectorCtor = window.BarcodeDetector;
  if (!BarcodeDetectorCtor) {
    throw new Error('This browser does not support live QR scanning. You can still paste the code manually.');
  }
  const formats = typeof BarcodeDetectorCtor.getSupportedFormats === 'function'
    ? await BarcodeDetectorCtor.getSupportedFormats()
    : ['qr_code'];
  if (!formats.includes('qr_code')) {
    throw new Error('QR scanning is not supported on this device browser. Please enter the code manually.');
  }
  pageState.detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
  pageState.detectorReady = true;
}

async function startScanner() {
  const video = $('residentQrVideo');
  if (!video) return;
  try {
    await ensureDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    pageState.scannerStream = stream;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    await video.play();
    pageState.scannerRunning = true;
    setScanStatus('Scanner is ready. Point the camera at member QR.', 'info');
    pageState.scanLoopHandle = requestAnimationFrame(scanLoop);
  } catch (error) {
    console.error(error);
    setScanStatus(error?.message || 'Unable to start scanner', 'error');
    showToast(error?.message || 'Unable to start scanner', 'error');
    await stopScanner();
  }
}

function bindScannerControls() {
  $('startResidentScannerBtn')?.addEventListener('click', startScanner);
  $('stopResidentScannerBtn')?.addEventListener('click', stopScanner);
  $('resolveResidentBtn')?.addEventListener('click', handleResolveResident);
  $('clearResidentScanBtn')?.addEventListener('click', () => {
    if ($('residentScanValueInput')) $('residentScanValueInput').value = '';
    pageState.lastScanValue = '';
    resetResidentSelection();
    setScanStatus('Scan cleared', 'info');
  });
}

function bindSpendForm() {
  $('residentSpendAmountInput')?.addEventListener('input', updateAmountPreview);
  $('residentRewardActionBtn')?.addEventListener('click', handleSaveSpend);
}

function bindQuickOutletButtons() {
  $$('.resident-outlet-chip').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const outlet = button.dataset.outlet || '';
      if ($('residentSpendOutletInput')) $('residentSpendOutletInput').value = outlet;
    });
  });
}

export async function loadResidentPointScannerPage() {
  if (!state.firebaseReady) {
    setScanStatus('Firebase not ready', 'error');
    return;
  }
  setFormulaCopy();
  updateAmountPreview();
  renderSelectedResident();
  await refreshRecentTransactions();
}

export function bindResidentPointScannerPage() {
  bindScannerControls();
  bindSpendForm();
  bindQuickOutletButtons();
  setFormulaCopy();
  updateAmountPreview();
  renderRecentTransactions();
  window.addEventListener('beforeunload', stopScanner, { once: true });
}
