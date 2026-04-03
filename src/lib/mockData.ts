import type {
  AppUser,
  Benefit,
  DashboardStat,
  MemberCard,
  MemberProfile,
  NewsItem,
  PointSummary,
  PointTransaction
} from './types';

export const mockUser: AppUser = {
  uid: 'demo-resident-uid',
  email: 'resident1@example.com',
  displayName: 'Wuttichai Resident',
  role: 'resident',
  residentId: 'resident_001',
  isActive: true
};

export const mockAdminUser: AppUser = {
  uid: 'demo-admin-uid',
  email: 'admin@example.com',
  displayName: 'LAYA Admin',
  role: 'admin',
  isActive: true
};

export const mockMemberCard: MemberCard = {
  id: 'resident_001',
  memberId: 'LAYA-RS-0007',
  fullName: 'Wuttichai Resident',
  roomLabel: 'Villa A203',
  tier: 'Elite Black Card',
  since: 'Member since 2026',
  qrPayload: 'resident:resident_001'
};

export const mockPointSummary: PointSummary = {
  balance: 28450,
  thisMonthEarned: 1920,
  expiringSoon: 650
};

export const mockTransactions: PointTransaction[] = [
  {
    id: 'ptx_001',
    date: '02 Apr 2026',
    outlet: 'Aroonsawat',
    spendAmount: 3250,
    points: 325,
    status: 'earned'
  },
  {
    id: 'ptx_002',
    date: '30 Mar 2026',
    outlet: 'The Taste',
    spendAmount: 2100,
    points: 210,
    status: 'earned'
  },
  {
    id: 'ptx_003',
    date: '25 Mar 2026',
    outlet: 'Spa',
    spendAmount: 4800,
    points: 480,
    status: 'earned'
  }
];

export const mockBenefits: Benefit[] = [
  {
    id: 'b_001',
    title: 'Dining Privilege',
    description: 'Receive 15% off food at selected outlets for member and registered guests.',
    tag: 'Dining',
    active: true,
    sortOrder: 1
  },
  {
    id: 'b_002',
    title: 'Resident Priority Concierge',
    description: 'Dedicated assistance for reservations, airport transfer, and stay arrangements.',
    tag: 'Service',
    active: true,
    sortOrder: 2
  },
  {
    id: 'b_003',
    title: 'Spa Benefit',
    description: 'Exclusive monthly spa privilege and special seasonal member offers.',
    tag: 'Wellness',
    active: true,
    sortOrder: 3
  }
];

export const mockNews: NewsItem[] = [
  {
    id: 'n_001',
    title: 'Resident Sunset Evening at Mangrove',
    excerpt: 'Private resident gathering with complimentary signature canapes and curated wines.',
    body: 'Celebrate with resident members in a refined sunset setting at Mangrove.',
    category: 'News',
    isPublished: true
  },
  {
    id: 'n_002',
    title: 'April Dining Privilege Collection',
    excerpt: 'Enjoy limited seasonal menus and exclusive member-only rates across selected venues.',
    body: 'A seasonal collection of privileges for resident dining experiences.',
    category: 'Promotion',
    isPublished: true
  },
  {
    id: 'n_003',
    title: 'New Wellness Experience Launch',
    excerpt: 'A refined spa ritual curated for resident members seeking a private retreat.',
    body: 'Discover a private wellness ritual curated for the resident community.',
    category: 'News',
    isPublished: true
  }
];

export const mockMembers: MemberProfile[] = [
  {
    id: 'resident_001',
    fullName: 'Wuttichai Resident',
    email: 'resident1@example.com',
    phone: '+66 80 000 0001',
    roomLabel: 'Villa A203',
    status: 'active',
    memberId: 'LAYA-RS-0007',
    tier: 'Elite Black Card',
    since: 'Member since 2026',
    qrPayload: 'resident:resident_001',
    pointBalance: 28450,
    pointsThisMonth: 1920,
    pointsExpiringSoon: 650,
    userUid: 'demo-resident-uid'
  },
  {
    id: 'resident_002',
    fullName: 'Narina Resident',
    email: 'resident2@example.com',
    phone: '+66 80 000 0002',
    roomLabel: 'Villa B104',
    status: 'active',
    memberId: 'LAYA-RS-0008',
    tier: 'Elite Black Card',
    since: 'Member since 2026',
    qrPayload: 'resident:resident_002',
    pointBalance: 18240,
    pointsThisMonth: 820,
    pointsExpiringSoon: 0,
    userUid: 'demo-resident-uid-2'
  },
  {
    id: 'resident_003',
    fullName: 'David Resident',
    email: 'resident3@example.com',
    phone: '+66 80 000 0003',
    roomLabel: 'Villa C301',
    status: 'inactive',
    memberId: 'LAYA-RS-0009',
    tier: 'Elite Black Card',
    since: 'Member since 2026',
    qrPayload: 'resident:resident_003',
    pointBalance: 9500,
    pointsThisMonth: 0,
    pointsExpiringSoon: 200,
    userUid: 'demo-resident-uid-3'
  }
];

export const mockDashboardStats: DashboardStat[] = [
  { label: 'Active Members', value: '128', hint: 'Resident accounts currently active' },
  { label: 'Points Issued', value: '42,890', hint: 'This month total issued points' },
  { label: 'Resident Spend', value: '฿428,900', hint: 'This month tracked spending' },
  { label: 'Pending Content', value: '5', hint: 'Items waiting for publish review' }
];
