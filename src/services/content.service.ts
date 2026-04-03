import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "../lib/firebase/config";
import { mapBenefitItem, mapNewsItem, mapPromotionItem } from "../lib/mappers/content.mapper";
import { mockBenefits, mockNews, mockPromotions } from "../lib/mock-data/content";
import type { BenefitItem, NewsItem, PromotionItem } from "../lib/types/content";

export async function getPublishedNews(): Promise<NewsItem[]> {
  if (!firebaseEnabled || !db) return mockNews;

  const q = query(collection(db, "resident_news"), orderBy("publishDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapNewsItem(item.id, item.data()));
}

export async function getPublishedPromotions(): Promise<PromotionItem[]> {
  if (!firebaseEnabled || !db) return mockPromotions;

  const q = query(
    collection(db, "resident_promotions"),
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapPromotionItem(item.id, item.data()));
}

export async function getActiveBenefits(): Promise<BenefitItem[]> {
  if (!firebaseEnabled || !db) return mockBenefits;

  const q = query(collection(db, "resident_benefits"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapBenefitItem(item.id, item.data()));
}

export async function createNews(payload: Partial<NewsItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return addDoc(collection(db, "resident_news"), payload);
}

export async function updateNews(id: string, payload: Partial<NewsItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_news", id), payload);
}

export async function createPromotion(payload: Partial<PromotionItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return addDoc(collection(db, "resident_promotions"), payload);
}

export async function updatePromotion(
  id: string,
  payload: Partial<PromotionItem>
) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_promotions", id), payload);
}

export async function createBenefit(payload: Partial<BenefitItem>) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return addDoc(collection(db, "resident_benefits"), payload);
}

export async function updateBenefit(
  id: string,
  payload: Partial<BenefitItem>
) {
  if (!firebaseEnabled || !db) return Promise.resolve();
  return updateDoc(doc(db, "resident_benefits", id), payload);
}
