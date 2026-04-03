import type { DashboardStats, StaffUser } from "../types/admin";
import type { PointTransaction, ResidentProfile } from "../types/resident";

export const mockAdminUser: StaffUser = {
  id: "staff_001",
  employeeId: "9001",
  fullName: "Resident Operations Admin",
  role: "admin",
  department: "Resident Services",
  active: true,
};

export const mockDashboardStats: DashboardStats = {
  transactionsToday: 18,
  pointsToday: 1240,
  activeResidents: 92,
  pendingDrafts: 5,
};

export const mockRecentTransactions = [
  {
    id: "tx_001",
    memberName: "Mr. Wuttichai",
    memberId: "LRC-000128",
    outletName: "Aroonsawat",
    amount: 2450,
    points: 98,
    time: "19:40",
    staffName: "Noi",
  },
  {
    id: "tx_002",
    memberName: "Mrs. Ananda",
    memberId: "LRC-000209",
    outletName: "The Taste",
    amount: 1520,
    points: 60,
    time: "18:15",
    staffName: "Mai",
  },
  {
    id: "tx_003",
    memberName: "Mr. Supachai",
    memberId: "LRC-000154",
    outletName: "Mangrove",
    amount: 3990,
    points: 159,
    time: "17:22",
    staffName: "Fah",
  },
];

export const mockOutlets = [
  { id: "the-taste", label: "The Taste" },
  { id: "aroonsawat", label: "Aroonsawat" },
  { id: "mangrove", label: "Mangrove" },
  { id: "spa", label: "Spa" },
];

export const mockResidentsTable: ResidentProfile[] = [
  {
    memberId: "LRC-000128",
    fullName: "Mr. Wuttichai",
    displayName: "Wuttichai",
    tier: "Elite Black Card",
    status: "active",
    pointBalance: 12840,
    totalEarned: 15420,
    totalUsed: 2580,
    residenceRef: "D-308",
    memberSince: "2025-05-01",
    phone: "+66 8X XXX XXXX",
    email: "resident1@example.com",
    qrToken: "qr_lrc_000128_secure_token",
  },
  {
    memberId: "LRC-000209",
    fullName: "Mrs. Ananda",
    displayName: "Ananda",
    tier: "Elite Black Card",
    status: "active",
    pointBalance: 9640,
    totalEarned: 10100,
    totalUsed: 460,
    residenceRef: "C-214",
    memberSince: "2025-07-16",
    phone: "+66 8X XXX XXXX",
    email: "resident2@example.com",
    qrToken: "qr_lrc_000209_secure_token",
  },
  {
    memberId: "LRC-000154",
    fullName: "Mr. Supachai",
    displayName: "Supachai",
    tier: "Elite Black Card",
    status: "inactive",
    pointBalance: 4200,
    totalEarned: 5200,
    totalUsed: 1000,
    residenceRef: "B-105",
    memberSince: "2025-03-22",
    phone: "+66 8X XXX XXXX",
    email: "resident3@example.com",
    qrToken: "qr_lrc_000154_secure_token",
  },
];

export const mockMemberTransactions: PointTransaction[] = [
  {
    id: "tx_member_001",
    memberId: "LRC-000128",
    date: "2026-04-01 19:40",
    outletName: "Aroonsawat",
    amount: 2450,
    pointsEarned: 98,
    status: "earned",
    billNumber: "AR-240401-101",
    note: "Dinner spending",
  },
  {
    id: "tx_member_002",
    memberId: "LRC-000128",
    date: "2026-03-28 12:20",
    outletName: "The Taste",
    amount: 1250,
    pointsEarned: 50,
    status: "earned",
    billNumber: "TT-240328-052",
  },
  {
    id: "tx_member_003",
    memberId: "LRC-000128",
    date: "2026-03-20 14:00",
    outletName: "Admin Adjustment",
    amount: 0,
    pointsEarned: 100,
    status: "adjusted",
    note: "Welcome privilege adjustment",
  },
];

export const mockPointAdjustments = [
  {
    id: "adj_001",
    memberId: "LRC-000128",
    type: "add",
    points: 100,
    reason: "Welcome privilege adjustment",
    updatedBy: "Resident Operations Admin",
    updatedAt: "2026-03-20 14:00",
  },
  {
    id: "adj_002",
    memberId: "LRC-000128",
    type: "deduct",
    points: 50,
    reason: "Manual correction",
    updatedBy: "Resident Operations Admin",
    updatedAt: "2026-03-18 10:15",
  },
];

export const mockMemberNotes = [
  {
    id: "note_001",
    memberId: "LRC-000128",
    text: "Resident prefers evening dining reservations.",
    createdAt: "2026-03-15 18:00",
  },
  {
    id: "note_002",
    memberId: "LRC-000128",
    text: "Requested early notification for owner events.",
    createdAt: "2026-03-10 09:30",
  },
];
