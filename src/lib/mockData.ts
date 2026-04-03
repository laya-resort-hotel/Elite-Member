import type {
  Benefit,
  DashboardStat,
  MemberCard,
  MemberProfile,
  NewsItem,
  PointSummary,
  PointTransaction
} from './types';

export const mockMemberCard: MemberCard = {
  id: 'card_001',
  memberId: 'LAYA-RS-0007',
  fullName: 'Wuttichai Resident',
  roomLabel: 'Villa A203',
  tier: 'Elite Black Card',
  since: 'Member since 2026',
  qrPayload: 'resident:LAYA-RS-0007'
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
    tag: 'Dining'
  },
  {
    id: 'b_002',
    title: 'Resident Priority Concierge',
    description: 'Dedicated assistance for reservations, airport transfer, and stay arrangements.',
    tag: 'Service'
  },
  {
    id: 'b_003',
    title: 'Spa Benefit',
    description: 'Exclusive monthly spa privilege and special seasonal member offers.',
    tag: 'Wellness'
  }
];

export const mockNews: NewsItem[] = [
  {
    id: 'n_001',
    title: 'Resident Sunset Evening at Mangrove',
    excerpt: 'Private resident gathering with complimentary signature canapés and curated wines.',
    category: 'News'
  },
  {
    id: 'n_002',
    title: 'April Dining Privilege Collection',
    excerpt: 'Enjoy limited seasonal menus and exclusive member-only rates across selected venues.',
    category: 'Promotion'
  },
  {
    id: 'n_003',
    title: 'New Wellness Experience Launch',
    excerpt: 'A refined spa ritual curated for resident members seeking a private retreat.',
    category: 'News'
  }
];

export const mockMembers: MemberProfile[] = [
  {
    id: 'm_001',
    fullName: 'Wuttichai Resident',
    email: 'resident1@example.com',
    phone: '+66 80 000 0001',
    roomLabel: 'Villa A203',
    status: 'active'
  },
  {
    id: 'm_002',
    fullName: 'Narina Resident',
    email: 'resident2@example.com',
    phone: '+66 80 000 0002',
    roomLabel: 'Villa B104',
    status: 'active'
  },
  {
    id: 'm_003',
    fullName: 'David Resident',
    email: 'resident3@example.com',
    phone: '+66 80 000 0003',
    roomLabel: 'Villa C301',
    status: 'inactive'
  }
];

export const mockDashboardStats: DashboardStat[] = [
  { label: 'Active Members', value: '128', hint: 'Resident accounts currently active' },
  { label: 'Points Issued', value: '42,890', hint: 'This month total issued points' },
  { label: 'Resident Spend', value: '฿428,900', hint: 'This month tracked spending' },
  { label: 'Pending Content', value: '5', hint: 'Items waiting for publish review' }
];
