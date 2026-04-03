import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, useMock } from '../firebase';
import { mockDashboardStats, mockMembers, mockNews } from '../mockData';
import type { AppUser, DashboardStat, MemberProfile, PointTransaction } from '../types';
import { formatCurrency, formatDate } from '../utils';

function mapResident(docId: string, data: Record<string, any>): MemberProfile {
  return {
    id: docId,
    fullName: data.fullName ?? 'Resident',
    email: data.email ?? '',
    phone: data.phone ?? '',
    roomLabel: data.roomLabel ?? '-',
    status: data.status === 'inactive' ? 'inactive' : 'active',
    memberId: data.memberId ?? docId,
    tier: 'Elite Black Card',
    since: data.since ?? 'Member since 2026',
    qrPayload: data.qrPayload ?? `resident:${docId}`,
    pointBalance: Number(data.pointBalance ?? 0),
    pointsThisMonth: Number(data.pointsThisMonth ?? 0),
    pointsExpiringSoon: Number(data.pointsExpiringSoon ?? 0),
    userUid: data.userUid
  };
}

export async function getMembers(): Promise<MemberProfile[]> {
  if (useMock) return mockMembers;
  if (!db) throw new Error('Firestore is not configured.');
  const snap = await getDocs(query(collection(db, 'residents'), orderBy('fullName', 'asc')));
  return snap.docs.map((docSnap) => mapResident(docSnap.id, docSnap.data()));
}

export async function getAdminDashboardStats(): Promise<DashboardStat[]> {
  if (useMock) return mockDashboardStats;
  if (!db) throw new Error('Firestore is not configured.');

  const [residentSnap, txSnap, newsSnap] = await Promise.all([
    getDocs(query(collection(db, 'residents'))),
    getDocs(query(collection(db, 'pointTransactions'), orderBy('createdAt', 'desc'), limit(100))),
    getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc'), limit(100)))
  ]);

  const activeMembers = residentSnap.docs.filter((docSnap) => docSnap.data().status !== 'inactive').length;
  const totalPointsIssued = txSnap.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().points ?? 0), 0);
  const totalSpend = txSnap.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().spendAmount ?? 0), 0);
  const draftCount = newsSnap.docs.filter((docSnap) => docSnap.data().isPublished !== true).length;

  return [
    { label: 'Active Members', value: String(activeMembers), hint: 'Resident accounts currently active' },
    { label: 'Points Issued', value: totalPointsIssued.toLocaleString(), hint: 'Latest tracked issued points' },
    { label: 'Resident Spend', value: formatCurrency(totalSpend), hint: 'Latest tracked spending total' },
    { label: 'Pending Content', value: String(draftCount), hint: 'News or promotions not yet published' }
  ];
}

export async function getRecentTransactions(): Promise<PointTransaction[]> {
  if (useMock) return [];
  if (!db) throw new Error('Firestore is not configured.');
  const txSnap = await getDocs(query(collection(db, 'pointTransactions'), orderBy('createdAt', 'desc'), limit(8)));
  return txSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      date: formatDate(data.createdAt?.toDate?.() ?? data.createdAt),
      outlet: data.outlet ?? '-',
      spendAmount: Number(data.spendAmount ?? 0),
      points: Number(data.points ?? 0),
      status: data.status === 'adjusted' ? 'adjusted' : 'earned'
    };
  });
}

export async function saveManualSpendEntry(params: {
  memberId: string;
  outlet: string;
  spendAmount: number;
  pointRateBahtPerPoint: number;
  operator: AppUser;
}) {
  if (useMock) {
    const points = Math.floor(params.spendAmount / params.pointRateBahtPerPoint);
    return { points, residentId: mockMembers[0].id };
  }

  if (!db) throw new Error('Firestore is not configured.');

  const residentsRef = collection(db, 'residents');
  const residentQuery = query(residentsRef, where('memberId', '==', params.memberId), limit(1));
  const residentResult = await getDocs(residentQuery);
  if (residentResult.empty) {
    throw new Error('Resident not found for this member ID.');
  }

  const residentDoc = residentResult.docs[0];
  const residentRef = doc(db, 'residents', residentDoc.id);
  const txRef = doc(collection(db, 'pointTransactions'));
  const points = Math.floor(params.spendAmount / params.pointRateBahtPerPoint);

  await runTransaction(db, async (transaction) => {
    const residentSnap = await transaction.get(residentRef);
    if (!residentSnap.exists()) {
      throw new Error('Resident profile no longer exists.');
    }

    const residentData = residentSnap.data();
    const nextBalance = Number(residentData.pointBalance ?? 0) + points;
    const nextThisMonth = Number(residentData.pointsThisMonth ?? 0) + points;

    transaction.update(residentRef, {
      pointBalance: nextBalance,
      pointsThisMonth: nextThisMonth,
      updatedAt: serverTimestamp()
    });

    transaction.set(txRef, {
      residentId: residentDoc.id,
      userUid: residentData.userUid ?? null,
      memberId: params.memberId,
      outlet: params.outlet,
      spendAmount: params.spendAmount,
      points,
      status: 'earned',
      createdAt: serverTimestamp(),
      createdByUid: params.operator.uid,
      createdByName: params.operator.displayName || params.operator.email
    });
  });

  return { points, residentId: residentDoc.id };
}

export async function updateResidentStatus(residentId: string, status: 'active' | 'inactive') {
  if (useMock) return;
  if (!db) throw new Error('Firestore is not configured.');
  await updateDoc(doc(db, 'residents', residentId), {
    status,
    updatedAt: serverTimestamp()
  });
}
