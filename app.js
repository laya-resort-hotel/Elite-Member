import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAncX8VGUjkegO4oLC6KWHAlWiSqhycVYw',
  authDomain: 'elite-black-card.firebaseapp.com',
  projectId: 'elite-black-card',
  storageBucket: 'elite-black-card.firebasestorage.app',
  messagingSenderId: '922581419999',
  appId: '1:922581419999:web:1d5fb7801e11cf2762666a',
  measurementId: 'G-JH9LJNE78M',
};

const demoResident = {
  id: 'demo-resident-001',
  memberCode: 'LAYA-0001',
  fullName: 'Noi Resident',
  tier: 'Elite Black',
  status: 'ACTIVE',
  residence: 'D-108',
  email: 'resident@demo.local',
  points: 42580,
  totalSpend: 238900,
};

const demoBenefits = [
  { title: 'Dining Privilege', body: 'รับส่วนลด 15% ที่ Aroonsawat และ The Taste สำหรับโต๊ะที่ลงทะเบียนสมาชิก' },
  { title: 'Resident Exclusive Rate', body: 'รับสิทธิ์ราคาพิเศษสำหรับบริการภายในรีสอร์ตและกิจกรรม select experiences' },
  { title: 'Priority Assistance', body: 'ช่องทางติดต่อพิเศษสำหรับ Resident services และ concierge support' },
];

const demoNews = [
  { title: 'Resident Sunset Reception', body: 'เชิญร่วมงานรับรอง Resident ประจำเดือน ณ Beach Lawn เวลา 18:00 น.' },
  { title: 'Owner Update', body: 'อัปเดตผลการบริหารห้องและ occupancy summary พร้อมให้ดูใน resident office' },
];

const demoPromotions = [
  { title: 'Wine & Dine Weekend', body: 'รับคะแนนพิเศษ x2 เมื่อใช้จ่ายครบ 3,000 บาท ที่ outlet ที่ร่วมรายการ' },
  { title: 'Spa Retreat Offer', body: 'แพ็กเกจสปาสำหรับสมาชิกพร้อม late checkout benefits ตามเงื่อนไข' },
];

const demoTransactions = [
  { createdLabel: '2026-04-02 19:20', outlet: 'Aroonsawat', amount: 2200, points: 2200, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-04-01 12:05', outlet: 'The Taste', amount: 1800, points: 1800, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
  { createdLabel: '2026-03-28 16:40', outlet: 'Spa', amount: 4500, points: 4500, memberCode: 'LAYA-0001', memberName: 'Noi Resident' },
];

const state = {
  app: null,
  db: null,
  auth: null,
  firebaseReady: false,
  currentUser: null,
  currentRole: null,
  currentResident: null,
  currentMode: 'auth', // auth | demo-resident | demo-admin | resident-live | admin-live
};

const $ = (id) => document.getElementById(id);
const screens = Array.from(document.querySelectorAll('.screen'));
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));

function formatTHB(value = 0) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function showToast(message, type = 'success') {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2800);
}

function setMode(mode) {
  state.currentMode = mode;
  $('modeState').textContent = mode;
}

function setScreen(screenId) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
  navButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screenId));
}

navButtons.forEach((btn) => btn.addEventListener('click', () => setScreen(btn.dataset.screen)));

function renderCards(listEl, items = [], emptyText = 'No data') {
  if (!items.length) {
    listEl.innerHTML = `<div class="card-item"><p>${emptyText}</p></div>`;
    return;
  }
  listEl.innerHTML = items.map((item) => `
    <div class="card-item">
      <h4>${escapeHtml(item.title || item.outlet || '-')}</h4>
      <p>${escapeHtml(item.body || '')}</p>
      ${item.createdLabel ? `<small>${escapeHtml(item.createdLabel)}</small>` : ''}
    </div>
  `).join('');
}

function renderTable(container, rows = []) {
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>No transactions yet</p></div>`;
    return;
  }
  container.innerHTML = `
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
            <td>${escapeHtml(row.memberName || '')}<br><small>${escapeHtml(row.memberCode || '')}</small></td>
            <td>${escapeHtml(row.outlet || '-')}</td>
            <td>${formatTHB(row.amount || 0)}</td>
            <td>${Number(row.points || 0).toLocaleString('th-TH')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderResidentCard(resident) {
  $('memberName').textContent = resident.fullName || 'Resident Member';
  $('memberTier').textContent = resident.tier || 'Elite Black';
  $('memberStatusPill').textContent = resident.status || 'ACTIVE';
  $('memberCode').textContent = resident.memberCode || 'LAYA-0001';
  $('memberResidence').textContent = resident.residence || '-';
  $('memberPoints').textContent = Number(resident.points || 0).toLocaleString('th-TH');
  $('memberSpend').textContent = formatTHB(resident.totalSpend || 0);
  renderQr(resident.memberCode || 'LAYA-0001');
}

function renderQr(text) {
  const canvas = $('memberQrCanvas');
  if (window.QRious) {
    new window.QRious({ element: canvas, value: text, size: 124, background: 'white', foreground: '#111111' });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '12px sans-serif';
    ctx.fillText(text, 12, 70);
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

async function initFirebase() {
  try {
    state.app = initializeApp(firebaseConfig);
    state.db = getFirestore(state.app);
    state.auth = getAuth(state.app);
    state.firebaseReady = true;
    $('firebaseState').textContent = 'Connected';
    onAuthStateChanged(state.auth, async (user) => {
      state.currentUser = user;
      $('authState').textContent = user?.email || 'Not signed in';
      $('loginBtn').classList.toggle('hidden', !!user);
      $('logoutBtn').classList.toggle('hidden', !user);
      if (!user) return;
      const profile = await loadUserProfile(user.uid, user.email);
      if (profile.role === 'admin' || profile.role === 'manager' || profile.role === 'staff') {
        state.currentRole = profile.role;
        setMode('admin-live');
        setScreen('screen-admin');
        await loadAdminDashboard();
      } else {
        state.currentRole = profile.role || 'resident';
        state.currentResident = await loadResidentForUser(user.uid, user.email, profile.memberCode);
        setMode('resident-live');
        setScreen('screen-resident');
        await loadResidentDashboard();
      }
    });
  } catch (error) {
    console.error(error);
    $('firebaseState').textContent = 'Error';
    showToast('Firebase init failed, using demo mode', 'error');
  }
}

async function loadUserProfile(uid, email) {
  try {
    const snap = await getDoc(doc(state.db, 'users', uid));
    if (snap.exists()) return snap.data();
  } catch (error) {
    console.warn('user profile read failed', error);
  }
  return { role: 'resident', email };
}

async function loadResidentForUser(uid, email, memberCode) {
  try {
    const residentsRef = collection(state.db, 'residents');
    let snap;
    if (memberCode) {
      snap = await getDocs(query(residentsRef, where('memberCode', '==', memberCode), limit(1)));
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    snap = await getDocs(query(residentsRef, where('uid', '==', uid), limit(1)));
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    snap = await getDocs(query(residentsRef, where('email', '==', email), limit(1)));
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (error) {
    console.warn('resident lookup failed', error);
  }
  return demoResident;
}

async function loadCollectionSafe(name, options = {}) {
  const colRef = collection(state.db, name);
  const qBase = [];
  if (options.whereMemberCode) qBase.push(where('memberCode', '==', options.whereMemberCode));
  if (options.orderBy !== false) qBase.push(orderBy(options.orderField || 'createdAt', 'desc'));
  if (options.limit) qBase.push(limit(options.limit));
  const qRef = query(colRef, ...qBase);
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdLabel: formatDate(d.data().createdAt) }));
}

async function loadResidentDashboard() {
  const resident = state.currentResident || demoResident;
  renderResidentCard(resident);
  try {
    const [benefits, news, promotions, transactions] = await Promise.all([
      loadCollectionSafe('benefits', { limit: 6 }),
      loadCollectionSafe('news', { limit: 5 }),
      loadCollectionSafe('promotions', { limit: 5 }),
      loadCollectionSafe('transactions', { limit: 10, whereMemberCode: resident.memberCode, orderBy: false }),
    ]);
    renderCards($('benefitsList'), benefits.length ? benefits : demoBenefits, 'No benefits yet');
    renderCards($('newsList'), news.length ? news : demoNews, 'No news yet');
    renderCards($('promoList'), promotions.length ? promotions : demoPromotions, 'No promotions yet');
    renderTable($('transactionsTable'), transactions.length ? transactions : demoTransactions);
  } catch (error) {
    console.warn(error);
    renderCards($('benefitsList'), demoBenefits);
    renderCards($('newsList'), demoNews);
    renderCards($('promoList'), demoPromotions);
    renderTable($('transactionsTable'), demoTransactions);
    showToast('ใช้ข้อมูลตัวอย่างชั่วคราว เพราะอ่าน Firestore ไม่ได้', 'error');
  }
}

async function loadAdminDashboard() {
  try {
    const [residents, transactions] = await Promise.all([
      loadCollectionSafe('residents', { orderBy: false }),
      loadCollectionSafe('transactions', { limit: 12 }),
    ]);
    $('kpiResidents').textContent = residents.length.toLocaleString('th-TH');
    const totalPoints = transactions.reduce((sum, row) => sum + Number(row.points || 0), 0);
    const totalSpend = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    $('kpiPoints').textContent = totalPoints.toLocaleString('th-TH');
    $('kpiSpend').textContent = formatTHB(totalSpend);
    renderTable($('adminTransactionsTable'), transactions);
    $('residentSearchResults').innerHTML = residents.slice(0, 6).map((resident) => residentCardHtml(resident)).join('');
  } catch (error) {
    console.warn(error);
    $('kpiResidents').textContent = '1';
    $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
    $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
    renderTable($('adminTransactionsTable'), demoTransactions);
    $('residentSearchResults').innerHTML = residentCardHtml(demoResident);
    showToast('แสดงข้อมูล demo admin เพราะยังอ่าน Firestore ไม่ได้', 'error');
  }
}

function residentCardHtml(resident) {
  return `
    <div class="card-item">
      <h4>${escapeHtml(resident.fullName || resident.memberName || '-')}</h4>
      <p>${escapeHtml(resident.memberCode || '-')}
      <br>${escapeHtml(resident.email || '')}
      <br>${escapeHtml(resident.residence || '')}</p>
    </div>
  `;
}

async function loginLive() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  if (!email || !password) {
    showToast('กรอก email และ password ก่อน', 'error');
    return;
  }
  try {
    await signInWithEmailAndPassword(state.auth, email, password);
    showToast('Login success');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Login failed', 'error');
  }
}

async function logoutLive() {
  try {
    if (state.auth?.currentUser) await signOut(state.auth);
    state.currentMode = 'auth';
    $('authState').textContent = 'Not signed in';
    setScreen('screen-auth');
    setMode('auth');
  } catch (error) {
    showToast('Logout failed', 'error');
  }
}

function openDemoResident() {
  state.currentResident = demoResident;
  renderResidentCard(demoResident);
  renderCards($('benefitsList'), demoBenefits);
  renderCards($('newsList'), demoNews);
  renderCards($('promoList'), demoPromotions);
  renderTable($('transactionsTable'), demoTransactions);
  setMode('demo-resident');
  setScreen('screen-resident');
}

function openDemoAdmin() {
  $('kpiResidents').textContent = '1';
  $('kpiPoints').textContent = demoTransactions.reduce((a, b) => a + b.points, 0).toLocaleString('th-TH');
  $('kpiSpend').textContent = formatTHB(demoTransactions.reduce((a, b) => a + b.amount, 0));
  $('residentSearchResults').innerHTML = residentCardHtml(demoResident);
  renderTable($('adminTransactionsTable'), demoTransactions);
  setMode('demo-admin');
  setScreen('screen-admin');
}

async function saveSimpleCMS(collectionName, title, body) {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }
  if (!title || !body) {
    showToast('กรอกข้อมูลให้ครบก่อนบันทึก', 'error');
    return;
  }
  try {
    await addDoc(collection(state.db, collectionName), {
      title,
      body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: state.currentUser?.email || 'manual-admin',
    });
    showToast(`Saved to ${collectionName}`);
    if (collectionName === 'news') { $('newsTitle').value = ''; $('newsBody').value = ''; }
    if (collectionName === 'promotions') { $('promoTitle').value = ''; $('promoBody').value = ''; }
    if (collectionName === 'benefits') { $('benefitTitle').value = ''; $('benefitBody').value = ''; }
    await loadAdminDashboard();
  } catch (error) {
    console.error(error);
    showToast(error.message || `Save ${collectionName} failed`, 'error');
  }
}

async function addSpendTransaction() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }
  const memberCode = $('spendMemberCode').value.trim();
  const memberName = $('spendMemberName').value.trim();
  const outlet = $('spendOutlet').value.trim();
  const amount = Number($('spendAmount').value || 0);
  const rate = Number($('pointRate').value || 1);
  if (!memberCode || !memberName || !outlet || !amount) {
    showToast('กรอกข้อมูลให้ครบก่อน', 'error');
    return;
  }
  const points = Math.round(amount * rate);
  try {
    const residentsRef = collection(state.db, 'residents');
    const residentQuery = query(residentsRef, where('memberCode', '==', memberCode), limit(1));
    const residentSnap = await getDocs(residentQuery);
    const residentDocSnap = residentSnap.docs[0];
    const residentRef = residentDocSnap ? doc(state.db, 'residents', residentDocSnap.id) : doc(collection(state.db, 'residents'));

    await runTransaction(state.db, async (transaction) => {
      const currentResidentSnap = await transaction.get(residentRef);
      const currentData = currentResidentSnap.exists() ? currentResidentSnap.data() : {};
      const nextPoints = Number(currentData.points || 0) + points;
      const nextSpend = Number(currentData.totalSpend || 0) + amount;
      transaction.set(residentRef, {
        fullName: memberName,
        memberCode,
        residence: currentData.residence || '-',
        status: currentData.status || 'ACTIVE',
        tier: currentData.tier || 'Elite Black',
        points: nextPoints,
        totalSpend: nextSpend,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    await addDoc(collection(state.db, 'transactions'), {
      memberCode,
      memberName,
      outlet,
      amount,
      points,
      createdAt: serverTimestamp(),
      createdBy: state.currentUser?.email || 'manual-admin',
    });

    $('spendAmount').value = '';
    showToast('Transaction saved');
    await loadAdminDashboard();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Save transaction failed', 'error');
  }
}

async function searchResidents() {
  const keyword = $('residentSearch').value.trim().toLowerCase();
  if (!keyword) {
    await loadAdminDashboard();
    return;
  }
  if (!state.firebaseReady) {
    $('residentSearchResults').innerHTML = residentCardHtml(demoResident);
    return;
  }
  try {
    const residents = await loadCollectionSafe('residents', { orderBy: false });
    const filtered = residents.filter((row) =>
      [row.fullName, row.memberCode, row.email].some((field) => String(field || '').toLowerCase().includes(keyword))
    );
    $('residentSearchResults').innerHTML = filtered.length
      ? filtered.map(residentCardHtml).join('')
      : '<div class="card-item"><p>No matching residents</p></div>';
  } catch (error) {
    console.error(error);
    showToast('Search failed', 'error');
  }
}

$('loginBtn').addEventListener('click', loginLive);
$('logoutBtn').addEventListener('click', logoutLive);
$('demoResidentBtn').addEventListener('click', openDemoResident);
$('demoAdminBtn').addEventListener('click', openDemoAdmin);
$('refreshResidentBtn').addEventListener('click', () => state.currentMode.includes('live') ? loadResidentDashboard() : openDemoResident());
$('loadAdminDataBtn').addEventListener('click', () => state.currentMode.includes('live') ? loadAdminDashboard() : openDemoAdmin());
$('saveNewsBtn').addEventListener('click', () => saveSimpleCMS('news', $('newsTitle').value.trim(), $('newsBody').value.trim()));
$('savePromoBtn').addEventListener('click', () => saveSimpleCMS('promotions', $('promoTitle').value.trim(), $('promoBody').value.trim()));
$('saveBenefitBtn').addEventListener('click', () => saveSimpleCMS('benefits', $('benefitTitle').value.trim(), $('benefitBody').value.trim()));
$('addSpendBtn').addEventListener('click', addSpendTransaction);
$('residentSearchBtn').addEventListener('click', searchResidents);

renderResidentCard(demoResident);
renderCards($('benefitsList'), demoBenefits);
renderCards($('newsList'), demoNews);
renderCards($('promoList'), demoPromotions);
renderTable($('transactionsTable'), demoTransactions);
setScreen('screen-auth');
initFirebase();
