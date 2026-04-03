import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseEnabled } from "../lib/firebase/config";
import type { AppRole, AppSession } from "../lib/types/auth";
import {
  getDemoAdminSession,
  getDemoResidentSession,
  setStoredDemoSession,
  clearStoredDemoSession,
} from "../lib/demo/session";

type UserDocShape = {
  role?: AppRole;
  displayName?: string;
  employeeId?: string;
  memberId?: string;
  email?: string;
};

function mapFirebaseSession(
  uid: string,
  email: string,
  fallbackRole: AppRole,
  data?: UserDocShape
): AppSession {
  return {
    uid,
    role: data?.role ?? fallbackRole,
    displayName: data?.displayName ?? "User",
    email: data?.email ?? email,
    employeeId: data?.employeeId ?? "",
    memberId: data?.memberId ?? "",
  };
}

export async function loginResident(
  identifier: string,
  password: string
): Promise<AppSession> {
  if (!firebaseEnabled || !auth || !db) {
    if (identifier !== "resident@example.com" || password !== "demo123") {
      throw new Error("Invalid demo resident credentials");
    }
    const session = getDemoResidentSession();
    setStoredDemoSession(session);
    return session;
  }

  const credential = await signInWithEmailAndPassword(auth, identifier, password);
  const userRef = doc(db, "resident_auth_profiles", credential.user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.exists() ? (userSnap.data() as UserDocShape) : undefined;

  return mapFirebaseSession(
    credential.user.uid,
    credential.user.email ?? "",
    "resident",
    data
  );
}

export async function loginAdmin(
  employeeId: string,
  password: string
): Promise<AppSession> {
  if (!firebaseEnabled || !auth || !db) {
    if (employeeId !== "9001" || password !== "demo123") {
      throw new Error("Invalid demo admin credentials");
    }
    const session = getDemoAdminSession();
    setStoredDemoSession(session);
    return session;
  }

  const normalizedEmail = `${employeeId}@laya-resident.local`;
  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );
  const userRef = doc(db, "staff_users", credential.user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.exists() ? (userSnap.data() as UserDocShape) : undefined;

  return mapFirebaseSession(
    credential.user.uid,
    normalizedEmail,
    "staff",
    data
  );
}

export async function logoutApp(): Promise<void> {
  if (firebaseEnabled && auth) {
    await signOut(auth);
  }
  clearStoredDemoSession();
}
