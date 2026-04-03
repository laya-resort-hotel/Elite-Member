import type { BenefitItem, NewsItem, PromotionItem } from "../types/content";

export const mockNews: NewsItem[] = [
  {
    id: "news_001",
    title: "Resident Sunset Reception",
    subtitle: "Exclusive invitation for Elite Black Card members",
    summary: "Join an elegant sunset reception hosted at LAYA Resort Hotel.",
    body: "Full article content goes here.",
    coverImage: "https://placehold.co/1200x675",
    publishDate: "2026-04-01",
    status: "published",
    featured: true,
  },
  {
    id: "news_002",
    title: "New Resident Lounge Privileges",
    summary: "Enhanced access and complimentary refreshments for residents.",
    body: "Full article content goes here.",
    coverImage: "https://placehold.co/1200x675",
    publishDate: "2026-03-25",
    status: "published",
  },
];

export const mockPromotions: PromotionItem[] = [
  {
    id: "promo_001",
    title: "Exclusive Dining Offer",
    outlet: "The Taste",
    summary: "Enjoy special dining privileges for resident members.",
    description: "Detailed promotion information here.",
    bannerImage: "https://placehold.co/1200x675",
    detailImage: "https://placehold.co/1240x1600",
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    status: "published",
    featured: true,
  },
];

export const mockBenefits: BenefitItem[] = [
  {
    id: "benefit_001",
    title: "Priority Dining Reservation",
    category: "Dining",
    shortDescription: "Enjoy priority access at selected outlets.",
    fullDescription: "Detailed benefit description here.",
    iconImage: "https://placehold.co/256x256",
    coverImage: "https://placehold.co/1080x1080",
    status: "active",
    sortOrder: 1,
    featured: true,
  },
  {
    id: "benefit_002",
    title: "Resident Welcome Privilege",
    category: "Owner Perks",
    shortDescription: "Special welcome privilege for eligible resident members.",
    fullDescription: "Detailed benefit description here.",
    iconImage: "https://placehold.co/256x256",
    coverImage: "https://placehold.co/1080x1080",
    status: "active",
    sortOrder: 2,
  },
];
