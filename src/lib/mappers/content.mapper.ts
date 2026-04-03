import type { DocumentData } from "firebase/firestore";
import type {
  BenefitItem,
  NewsItem,
  PromotionItem,
} from "../types/content";

export function mapNewsItem(id: string, data: DocumentData): NewsItem {
  return {
    id,
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    summary: data.summary ?? "",
    body: data.body ?? "",
    coverImage: data.coverImage ?? "",
    publishDate: data.publishDate ?? "",
    status: data.status ?? "draft",
    featured: Boolean(data.featured),
  };
}

export function mapPromotionItem(
  id: string,
  data: DocumentData
): PromotionItem {
  return {
    id,
    title: data.title ?? "",
    outlet: data.outlet ?? "",
    summary: data.summary ?? "",
    description: data.description ?? "",
    bannerImage: data.bannerImage ?? "",
    detailImage: data.detailImage ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    status: data.status ?? "draft",
    featured: Boolean(data.featured),
  };
}

export function mapBenefitItem(id: string, data: DocumentData): BenefitItem {
  return {
    id,
    title: data.title ?? "",
    category: data.category ?? "",
    shortDescription: data.shortDescription ?? "",
    fullDescription: data.fullDescription ?? "",
    iconImage: data.iconImage ?? "",
    coverImage: data.coverImage ?? "",
    status: data.status ?? "active",
    sortOrder: Number(data.sortOrder ?? 0),
    featured: Boolean(data.featured),
  };
}
