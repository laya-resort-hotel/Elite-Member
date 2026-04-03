import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db, useMock } from '../firebase';
import { mockBenefits, mockNews } from '../mockData';
import type { Benefit, NewsItem } from '../types';

export async function getEditableNews(): Promise<NewsItem[]> {
  if (useMock) return mockNews;
  if (!db) throw new Error('Firestore is not configured.');
  const snap = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<NewsItem, 'id'>) }));
}

export async function saveNewsItem(payload: {
  id?: string;
  title: string;
  excerpt: string;
  body?: string;
  category: 'News' | 'Promotion';
  isPublished?: boolean;
}) {
  if (useMock) return;
  if (!db) throw new Error('Firestore is not configured.');

  const data = {
    title: payload.title,
    excerpt: payload.excerpt,
    body: payload.body ?? '',
    category: payload.category,
    isPublished: payload.isPublished ?? true,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (payload.id) {
    await setDoc(doc(db, 'news', payload.id), data, { merge: true });
    return;
  }

  await addDoc(collection(db, 'news'), data);
}

export async function getEditableBenefits(): Promise<Benefit[]> {
  if (useMock) return mockBenefits;
  if (!db) throw new Error('Firestore is not configured.');
  const snap = await getDocs(query(collection(db, 'benefits'), orderBy('sortOrder', 'asc')));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Benefit, 'id'>) }));
}

export async function saveBenefit(payload: {
  id?: string;
  title: string;
  description: string;
  tag: string;
  active?: boolean;
  sortOrder?: number;
}) {
  if (useMock) return;
  if (!db) throw new Error('Firestore is not configured.');

  const data = {
    title: payload.title,
    description: payload.description,
    tag: payload.tag,
    active: payload.active ?? true,
    sortOrder: payload.sortOrder ?? 999,
    updatedAt: serverTimestamp()
  };

  if (payload.id) {
    await setDoc(doc(db, 'benefits', payload.id), data, { merge: true });
    return;
  }

  await addDoc(collection(db, 'benefits'), { ...data, createdAt: serverTimestamp() });
}
