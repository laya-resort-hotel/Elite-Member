export type Role = 'resident' | 'staff' | 'manager' | 'admin';

export interface MemberCard {
  id: string;
  memberId: string;
  fullName: string;
  roomLabel: string;
  tier: 'Elite Black Card';
  since: string;
  qrPayload: string;
}

export interface PointSummary {
  balance: number;
  thisMonthEarned: number;
  expiringSoon: number;
}

export interface PointTransaction {
  id: string;
  date: string;
  outlet: string;
  spendAmount: number;
  points: number;
  status: 'earned' | 'adjusted';
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  tag: string;
  active?: boolean;
  sortOrder?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  body?: string;
  category: 'News' | 'Promotion';
  isPublished?: boolean;
}

export interface MemberProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roomLabel: string;
  status: 'active' | 'inactive';
  memberId: string;
  tier: 'Elite Black Card';
  since: string;
  qrPayload: string;
  pointBalance: number;
  pointsThisMonth: number;
  pointsExpiringSoon: number;
  userUid?: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  residentId?: string;
  isActive?: boolean;
}
