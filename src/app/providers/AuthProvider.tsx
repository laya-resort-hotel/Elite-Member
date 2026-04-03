import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseEnabled } from "../../lib/firebase/config";
import type { AppSession, AuthContextValue } from "../../lib/types/auth";
import {
  getStoredDemoSession,
  clearStoredDemoSession,
} from "../../lib/demo/session";
import {
  loginAdmin,
  loginResident,
  logoutApp,
} from "../../services/auth.service";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setSession(getStoredDemoSession());
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      setSession((prev) => {
        if (prev?.uid === firebaseUser.uid) return prev;
        return {
          uid: firebaseUser.uid,
          role: "resident",
          displayName: firebaseUser.displayName ?? "User",
          email: firebaseUser.email ?? "",
        };
      });
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signInResident: async (identifier, password) => {
        setIsLoading(true);
        try {
          const result = await loginResident(identifier, password);
          setSession(result);
        } finally {
          setIsLoading(false);
        }
      },
      signInAdmin: async (employeeId, password) => {
        setIsLoading(true);
        try {
          const result = await loginAdmin(employeeId, password);
          setSession(result);
        } finally {
          setIsLoading(false);
        }
      },
      signOutApp: async () => {
        await logoutApp();
        clearStoredDemoSession();
        setSession(null);
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
