
import { state, setMode } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoResident, demoTransactions } from '../data/demo.js';
import { loadAllResidents } from '../services/member-service.js';
import { addSpendTransaction, loadTransactions } from '../services/transaction-service.js';
import { renderAdminKpis, renderResidentSearchResults, renderTable, updateStatusLabels } from '../ui/renderers.js';
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
    if ($('kpiResidents')) $('kpiResidents').textContent = '1';
    if ($('kpiPoints')) $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
    if ($('kpiSpend')) $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
    renderTable($('adminTransactionsTable'), demoTransactions);
    renderResidentSearchResults($('residentSearchResults'), [demoResident]);
    showToast('แสดงข้อมูล demo admin เพราะยังอ่าน Firestore ไม่ได้', 'error');
  }
}

export function openDemoAdmin() {
  if ($('kpiResidents')) $('kpiResidents').textContent = '1';
  if ($('kpiPoints')) $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
  if ($('kpiSpend')) $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
  renderResidentSearchResults($('residentSearchResults'), [demoResident]);
  renderTable($('adminTransactionsTable'), demoTransactions);
  setMode('demo-admin');
  updateStatusLabels({ modeState: 'demo-admin' });
}

export function bindAdminPage() {
  if ($('loadAdminDataBtn')) {
    $('loadAdminDataBtn').addEventListener('click', async () => {
      if (state.currentMode.includes('live')) {
        await loadAdminDashboard();
        return;
      }
      openDemoAdmin();
    });
  }

  if ($('addSpendBtn')) {
    $('addSpendBtn').addEventListener('click', async () => {
      if (!state.firebaseReady) {
        showToast('Firebase not ready', 'error');
        return;
      }
      const payload = {
        memberCode: $('spendMemberCode')?.value.trim(),
        memberName: $('spendMemberName')?.value.trim(),
        outlet: $('spendOutlet')?.value.trim(),
        amount: Number($('spendAmount')?.value || 0),
        rate: Number($('pointRate')?.value || 1),
      };
      if (!payload.memberCode || !payload.memberName || !payload.outlet || !payload.amount) {
        showToast('กรอกข้อมูลให้ครบก่อน', 'error');
        return;
      }
      try {
        await addSpendTransaction(payload);
        if ($('spendAmount')) $('spendAmount').value = '';
        showToast('Transaction saved');
        await loadAdminDashboard();
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Save transaction failed', 'error');
      }
    });
  }
}
