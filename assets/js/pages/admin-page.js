import { state, setMode } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoResident, demoTransactions } from '../data/demo.js';
import { loadAllResidents, searchResidents } from '../services/member-service.js';
import { saveSimpleCMS } from '../services/content-service.js';
import { addSpendTransaction, loadTransactions } from '../services/transaction-service.js';
import { renderAdminKpis, renderResidentSearchResults, renderTable, updateStatusLabels } from '../ui/renderers.js';
import { setScreen } from '../ui/navigation.js';
import { showToast } from '../ui/toast.js';
import { formatTHB } from '../core/format.js';

export async function loadAdminDashboard() {
  try {
    const [residents, transactions] = await Promise.all([
      loadAllResidents(),
      loadTransactions({ limit: 12 }),
    ]);
    const totalPoints = transactions.reduce((sum, row) => sum + Number(row.points || 0), 0);
    const totalSpend = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    renderAdminKpis({ residents: residents.length, points: totalPoints, spend: totalSpend });
    renderTable($('adminTransactionsTable'), transactions);
    renderResidentSearchResults($('residentSearchResults'), residents.slice(0, 6));
  } catch (error) {
    console.warn(error);
    $('kpiResidents').textContent = '1';
    $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
    $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
    renderTable($('adminTransactionsTable'), demoTransactions);
    renderResidentSearchResults($('residentSearchResults'), [demoResident]);
    showToast('แสดงข้อมูล demo admin เพราะยังอ่าน Firestore ไม่ได้', 'error');
  }
}

export function openDemoAdmin() {
  $('kpiResidents').textContent = '1';
  $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
  $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
  renderResidentSearchResults($('residentSearchResults'), [demoResident]);
  renderTable($('adminTransactionsTable'), demoTransactions);
  setMode('demo-admin');
  updateStatusLabels({ modeState: 'demo-admin' });
  setScreen('screen-admin');
}

export function bindAdminPage() {
  $('loadAdminDataBtn').addEventListener('click', async () => {
    if (state.currentMode.includes('live')) {
      await loadAdminDashboard();
      return;
    }
    openDemoAdmin();
  });

  $('residentSearchBtn').addEventListener('click', async () => {
    const keyword = $('residentSearch').value.trim();
    if (!state.firebaseReady) {
      renderResidentSearchResults($('residentSearchResults'), [demoResident]);
      return;
    }
    try {
      const results = await searchResidents(keyword);
      renderResidentSearchResults($('residentSearchResults'), results);
    } catch (error) {
      console.error(error);
      showToast('Search failed', 'error');
    }
  });

  $('addSpendBtn').addEventListener('click', async () => {
    if (!state.firebaseReady) {
      showToast('Firebase not ready', 'error');
      return;
    }
    const payload = {
      memberCode: $('spendMemberCode').value.trim(),
      memberName: $('spendMemberName').value.trim(),
      outlet: $('spendOutlet').value.trim(),
      amount: Number($('spendAmount').value || 0),
      rate: Number($('pointRate').value || 1),
    };
    if (!payload.memberCode || !payload.memberName || !payload.outlet || !payload.amount) {
      showToast('กรอกข้อมูลให้ครบก่อน', 'error');
      return;
    }
    try {
      await addSpendTransaction(payload);
      $('spendAmount').value = '';
      showToast('Transaction saved');
      await loadAdminDashboard();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Save transaction failed', 'error');
    }
  });

  $('saveNewsBtn').addEventListener('click', async () => {
    await saveCmsByForm('news', 'newsTitle', 'newsBody');
  });
  $('savePromoBtn').addEventListener('click', async () => {
    await saveCmsByForm('promotions', 'promoTitle', 'promoBody');
  });
  $('saveBenefitBtn').addEventListener('click', async () => {
    await saveCmsByForm('benefits', 'benefitTitle', 'benefitBody');
  });
}

async function saveCmsByForm(collectionName, titleId, bodyId) {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }
  const title = $(titleId).value.trim();
  const body = $(bodyId).value.trim();
  if (!title || !body) {
    showToast('กรอกข้อมูลให้ครบก่อนบันทึก', 'error');
    return;
  }
  try {
    await saveSimpleCMS(collectionName, title, body);
    $(titleId).value = '';
    $(bodyId).value = '';
    showToast(`Saved to ${collectionName}`);
    await loadAdminDashboard();
  } catch (error) {
    console.error(error);
    showToast(error.message || `Save ${collectionName} failed`, 'error');
  }
}
