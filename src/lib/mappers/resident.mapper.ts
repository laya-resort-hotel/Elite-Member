import type { DocumentData } from "firebase/firestore";
import type { PointTransaction, ResidentProfile } from "../types/resident";

export function mapResidentProfile(
  id: string,
  data: DocumentData
): ResidentProfile {
  return {
    memberId: data.memberId ?? id,
    fullName: data.fullName ?? "",
    displayName: data.displayName ?? data.fullName ?? "",
    tier: "Elite Black Card",
    status: data.status ?? "active",
    pointBalance: Number(data.pointBalance ?? 0),
    totalEarned: Number(data.totalEarned ?? 0),
    totalUsed: Number(data.totalUsed ?? 0),
    residenceRef: data.residenceRef ?? "",
    memberSince: data.memberSince ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    qrToken: data.qrToken ?? "",
  };
}

export function mapPointTransaction(
  id: string,
  data: DocumentData
): PointTransaction {
  return {
    id,
    memberId: data.memberId ?? "",
    date: data.date ?? "",
    outletName: data.outletName ?? "",
    amount: Number(data.amount ?? 0),
    pointsEarned: Number(data.pointsEarned ?? 0),
    status: data.status ?? "earned",
    billNumber: data.billNumber ?? "",
    note: data.note ?? "",
  };
}
