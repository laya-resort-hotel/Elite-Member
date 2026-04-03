import type { PublishStatus } from "./content";

export type StaffRole = "staff" | "supervisor" | "manager" | "admin";

export interface StaffUser {
  id: string;
  employeeId: string;
  fullName: string;
  role: StaffRole;
  department: string;
  active: boolean;
}

export interface SpendEntryFormValues {
  memberId: string;
  outletId: string;
  billNumber: string;
  amount: number | "";
  pointRate: number;
  pointsPreview: number;
  note: string;
}

export interface DashboardStats {
  transactionsToday: number;
  pointsToday: number;
  activeResidents: number;
  pendingDrafts: number;
}

export interface ContentEditorMeta {
  status: PublishStatus;
  updatedBy: string;
  updatedAt: string;
}
