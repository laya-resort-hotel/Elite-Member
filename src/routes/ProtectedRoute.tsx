import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';

export function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!allow.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
