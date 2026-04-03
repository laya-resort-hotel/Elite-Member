export type MemberTier = "Elite Black Card";

export type MemberStatus = "active" | "inactive" | "suspended";

export interface ResidentProfile {
  memberId: string;
  fullName: string;
  displayName: string;
  tier: MemberTier;
  status: MemberStatus;
  pointBalance: number;
  totalEarned: number;
  totalUsed: number;
  residenceRef: string;
  memberSince: string;
  phone?: string;
  email?: string;
  qrToken: string;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  date: string;
  outletName: string;
  amount: number;
  pointsEarned: number;
  status: "earned" | "used" | "adjusted" | "voided";
  billNumber?: string;
  note?: string;
}
