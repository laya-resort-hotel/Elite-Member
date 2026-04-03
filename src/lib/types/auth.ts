export type AppRole =
  | "resident"
  | "staff"
  | "supervisor"
  | "manager"
  | "admin";

export interface AppSession {
  uid: string;
  role: AppRole;
  displayName: string;
  email?: string;
  employeeId?: string;
  memberId?: string;
}

export interface AuthContextValue {
  session: AppSession | null;
  isLoading: boolean;
  signInResident: (identifier: string, password: string) => Promise<void>;
  signInAdmin: (employeeId: string, password: string) => Promise<void>;
  signOutApp: () => Promise<void>;
}
