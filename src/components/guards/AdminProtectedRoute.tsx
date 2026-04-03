import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

const adminRoles = ["staff", "supervisor", "manager", "admin"] as const;

export function AdminProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!adminRoles.includes(session.role as (typeof adminRoles)[number])) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
