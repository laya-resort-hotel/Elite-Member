import type { AppSession } from "../types/auth";

const STORAGE_KEY = "laya_resident_demo_session";

export function getStoredDemoSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

export function setStoredDemoSession(session: AppSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredDemoSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDemoResidentSession(): AppSession {
  return {
    uid: "demo-resident-001",
    role: "resident",
    displayName: "Wuttichai",
    email: "resident@example.com",
    memberId: "LRC-000128",
  };
}

export function getDemoAdminSession(): AppSession {
  return {
    uid: "demo-admin-001",
    role: "admin",
    displayName: "Resident Operations Admin",
    email: "9001@laya-resident.local",
    employeeId: "9001",
  };
}
