import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!session) {
    return <Outlet />;
  }

  if (session.role === "resident") {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
}
