export const RESIDENT_ROUTES = {
  LOGIN: "/login",
  HOME: "/home",
  CARD: "/card",
  QR: "/card/qr",
  POINTS: "/points",
  BENEFITS: "/benefits",
  MORE: "/more",
  NEWS: "/more/news",
  PROMOTIONS: "/more/promotions",
  PROFILE: "/more/profile",
  SETTINGS: "/more/settings",
  CONTACT: "/more/contact",
} as const;

export const ADMIN_ROUTES = {
  LOGIN: "/admin/login",
  DASHBOARD: "/admin/dashboard",
  MEMBERS: "/admin/members",
  SPEND_ENTRY: "/admin/spend-entry",
  NEWS_EDITOR: "/admin/content/news",
  PROMOTION_EDITOR: "/admin/content/promotions",
  BENEFIT_EDITOR: "/admin/content/benefits",
} as const;
