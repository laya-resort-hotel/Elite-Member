import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData
} from 'firebase/firestore';
import { db, useMock } from '../firebase';
import {
  mockBenefits,
  mockMemberCard,
  mockMembers,
  mockNews,
  mockPointSummary,
  mockTransactions
} from '../mockData';
import type { AppUser, Benefit, MemberCard, MemberProfile, NewsItem, PointSummary, PointTransaction } from '../types';
import { formatDate } from '../utils';

function toMemberProfile(id: string, data: DocumentData): MemberProfile {
  return {
    id,
    fullName: data.fullName ?? 'Resident',
    email: data.email ?? '',
    phone: data.phone ?? '',
    roomLabel: data.roomLabel ?? '-',
    status: data.status === 'inactive' ? 'inactive' : 'active',
    memberId: data.memberId ?? id,
    tier: 'Elite Black Card',
    since: data.since ?? 'Member since 2026',
    qrPayload: data.qrPayload ?? `resident:${id}`,
    pointBalance: Number(data.pointBalance ?? 0),
    pointsThisMonth: Number(data.pointsThisMonth ?? 0),
    pointsExpiringSoon: Number(data.pointsExpiringSoon ?? 0),
    userUid: data.userUid
  };
}

export async function getResidentProfile(currentUser: AppUser): Promise<MemberProfile> {
  if (useMock) {
    return mockMembers[0];
  }

  if (!db) throw new Error('Firestore is not configured.');

  if (currentUser.residentId) {
    const residentSnap = await getDoc(doc(db, 'residents', currentUser.residentId));
    if (residentSnap.exists()) {
      return toMemberProfile(residentSnap.id, residentSnap.data());
    }
  }

  const residentsRef = collection(db, 'residents');
  const residentQuery = query(residentsRef, where('userUid', '==', currentUser.uid), limit(1));
  const residentResult = await getDocs(residentQuery);

  if (residentResult.empty) {
    throw new Error('No resident profile found for this account.');
  }

  const residentDoc = residentResult.docs[0];
  return toMemberProfile(residentDoc.id, residentDoc.data());
}

export function profileToCard(profile: MemberProfile): MemberCard {
  return {
    id: profile.id,
    memberId: profile.memberId,
    fullName: profile.fullName,
    roomLabel: profile.roomLabel,
    tier: profile.tier,
    since: profile.since,
    qrPayload: profile.qrPayload
  };
}

export function profileToSummary(profile: MemberProfile): PointSummary {
  return {
    balance: profile.pointBalance,
    thisMonthEarned: profile.pointsThisMonth,
    expiringSoon: profile.pointsExpiringSoon
  };
}

export async function getResidentTransactions(profile: MemberProfile): Promise<PointTransaction[]> {
  if (useMock) {
    return mockTransactions;
  }

  if (!db) throw new Error('Firestore is not configured.');

  const txQuery = query(
    collection(db, 'pointTransactions'),
    where('residentId', '==', profile.id),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(txQuery);

  return snap.docs.map((docSnap) => {
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

export async function getBenefits(): Promise<Benefit[]> {
  if (useMock) return mockBenefits;
  if (!db) throw new Error('Firestore is not configured.');
  const benefitsQuery = query(collection(db, 'benefits'), where('active', '==', true), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(benefitsQuery);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Benefit, 'id'>) }));
}

export async function getNewsItems(): Promise<NewsItem[]> {
  if (useMock) return mockNews;
  if (!db) throw new Error('Firestore is not configured.');
  const newsQuery = query(collection(db, 'news'), where('isPublished', '==', true), orderBy('publishedAt', 'desc'), limit(20));
  const snap = await getDocs(newsQuery);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title ?? 'Untitled',
      excerpt: data.excerpt ?? '',
      body: data.body ?? '',
      category: data.category === 'Promotion' ? 'Promotion' : 'News',
      isPublished: Boolean(data.isPublished)
    };
  });
}

export async function getResidentDashboard(currentUser: AppUser) {
  if (useMock) {
    return {
      card: mockMemberCard,
      summary: mockPointSummary,
      transactions: mockTransactions,
      benefits: mockBenefits,
      news: mockNews,
      profile: mockMembers[0]
    };
  }

  const profile = await getResidentProfile(currentUser);
  const [transactions, benefits, news] = await Promise.all([
    getResidentTransactions(profile),
    getBenefits(),
    getNewsItems()
  ]);

  return {
    card: profileToCard(profile),
    summary: profileToSummary(profile),
    transactions,
    benefits,
    news,
    profile
  };
}
