import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, firebaseEnabled } from "../lib/firebase/config";
import {
  mapBenefitItem,
  mapNewsItem,
  mapPromotionItem,
} from "../lib/mappers/content.mapper";
import {
  mockBenefits,
  mockNews,
  mockPromotions,
} from "../lib/mock-data/content";
import type { BenefitItem, NewsItem, PromotionItem } from "../lib/types/content";

function nowIso() {
  return new Date().toISOString();
}

export async function getPublishedNews(): Promise<NewsItem[]> {
  if (!firebaseEnabled || !db) return mockNews;
  const q = query(
    collection(db, "resident_news"),
    where("status", "==", "published"),
    orderBy("publishDate", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapNewsItem(item.id, item.data()));
}

export async function getNewsItem(id: string): Promise<NewsItem | null> {
  if (!firebaseEnabled || !db) {
    return mockNews.find((item) => item.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, "resident_news", id));
  if (!snap.exists()) return null;
  return mapNewsItem(snap.id, snap.data());
}

export async function createNews(payload: Omit<Partial<NewsItem>, "id">) {
  if (!firebaseEnabled || !db) return Promise.resolve({ id: "demo-news-id" });
  const docRef = await addDoc(collection(db, "resident_news"), {
    ...payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return { id: docRef.id };
}

export async function updateNews(id: string, payload: Partial<NewsItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_news", id), {
    ...payload,
    updatedAt: nowIso(),
  });
}

export async function deleteNews(id: string) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return deleteDoc(doc(db, "resident_news", id));
}

export async function getPublishedPromotions(): Promise<PromotionItem[]> {
  if (!firebaseEnabled || !db) return mockPromotions;
  const q = query(
    collection(db, "resident_promotions"),
    where("status", "==", "published"),
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapPromotionItem(item.id, item.data()));
}

export async function getPromotionItem(id: string): Promise<PromotionItem | null> {
  if (!firebaseEnabled || !db) {
    return mockPromotions.find((item) => item.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, "resident_promotions", id));
  if (!snap.exists()) return null;
  return mapPromotionItem(snap.id, snap.data());
}

export async function createPromotion(payload: Omit<Partial<PromotionItem>, "id">) {
  if (!firebaseEnabled || !db) return Promise.resolve({ id: "demo-promo-id" });
  const docRef = await addDoc(collection(db, "resident_promotions"), {
    ...payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return { id: docRef.id };
}

export async function updatePromotion(id: string, payload: Partial<PromotionItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_promotions", id), {
    ...payload,
    updatedAt: nowIso(),
  });
}

export async function deletePromotion(id: string) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return deleteDoc(doc(db, "resident_promotions", id));
}

export async function getActiveBenefits(): Promise<BenefitItem[]> {
  if (!firebaseEnabled || !db) return mockBenefits;
  const q = query(
    collection(db, "resident_benefits"),
    where("status", "==", "active"),
    orderBy("sortOrder", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapBenefitItem(item.id, item.data()));
}

export async function getBenefitItem(id: string): Promise<BenefitItem | null> {
  if (!firebaseEnabled || !db) {
    return mockBenefits.find((item) => item.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, "resident_benefits", id));
  if (!snap.exists()) return null;
  return mapBenefitItem(snap.id, snap.data());
}

export async function createBenefit(payload: Omit<Partial<BenefitItem>, "id">) {
  if (!firebaseEnabled || !db) return Promise.resolve({ id: "demo-benefit-id" });
  const docRef = await addDoc(collection(db, "resident_benefits"), {
    ...payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return { id: docRef.id };
}

export async function updateBenefit(id: string, payload: Partial<BenefitItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_benefits", id), {
    ...payload,
    updatedAt: nowIso(),
  });
}

export async function deleteBenefit(id: string) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return deleteDoc(doc(db, "resident_benefits", id));
}
