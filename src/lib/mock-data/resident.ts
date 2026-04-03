import type { PointTransaction, ResidentProfile } from "../types/resident";

export const mockResidentProfile: ResidentProfile = {
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
  email: "resident@example.com",
  qrToken: "qr_lrc_000128_secure_token",
};

export const mockPointTransactions: PointTransaction[] = [
  {
    id: "tx_001",
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
    id: "tx_002",
    memberId: "LRC-000128",
    date: "2026-03-28 12:20",
    outletName: "The Taste",
    amount: 1250,
    pointsEarned: 50,
    status: "earned",
    billNumber: "TT-240328-052",
  },
  {
    id: "tx_003",
    memberId: "LRC-000128",
    date: "2026-03-20 14:00",
    outletName: "Admin Adjustment",
    amount: 0,
    pointsEarned: 100,
    status: "adjusted",
    note: "Welcome privilege adjustment",
  },
];
