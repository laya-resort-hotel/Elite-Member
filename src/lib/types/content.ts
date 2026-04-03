export type PublishStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "expired"
  | "archived";

export interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  body: string;
  coverImage: string;
  publishDate: string;
  status: PublishStatus;
  featured?: boolean;
}

export interface PromotionItem {
  id: string;
  title: string;
  outlet: string;
  summary: string;
  description: string;
  bannerImage: string;
  detailImage?: string;
  startDate: string;
  endDate: string;
  status: PublishStatus;
  featured?: boolean;
}

export interface BenefitItem {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  iconImage?: string;
  coverImage?: string;
  status: "active" | "inactive";
  sortOrder: number;
  featured?: boolean;
}
