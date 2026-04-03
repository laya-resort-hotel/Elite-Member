import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, useMock } from '../lib/firebase';
import { mockAdminUser, mockUser } from '../lib/mockData';
import { getAppUserFromFirebaseUser, signIn, signOut } from '../lib/services/authService';
import type { AppUser, Role } from '../lib/types';

interface AuthContextValue {
  user: AppUser | null;
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setDemoRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMock) {
      setUser(mockUser);
      setLoading(false);
      return;
    }

    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const appUser = await getAppUserFromFirebaseUser(firebaseUser);
        setUser(appUser);
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const nextUser = await signIn(email, password);
      setUser(nextUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    if (useMock) {
      setUser(mockUser);
      return;
    }
    setUser(null);
  }, []);

  const setDemoRole = useCallback((role: Role) => {
    if (!useMock) return;
    setUser(role === 'admin' || role === 'manager' || role === 'staff' ? { ...mockAdminUser, role } : { ...mockUser, role });
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? 'resident',
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      setDemoRole
    }),
    [user, loading, login, logout, setDemoRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
