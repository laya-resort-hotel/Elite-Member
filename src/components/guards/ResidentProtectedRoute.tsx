import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export function ResidentProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session.role !== "resident") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
