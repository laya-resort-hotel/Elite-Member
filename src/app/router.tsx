import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/resident/LoginPage";
import HomePage from "../pages/resident/HomePage";
import CardPage from "../pages/resident/CardPage";
import QRPage from "../pages/resident/QRPage";
import PointsPage from "../pages/resident/PointsPage";
import BenefitsPage from "../pages/resident/BenefitsPage";
import MorePage from "../pages/resident/MorePage";
import NewsListPage from "../pages/resident/NewsListPage";
import PromotionsPage from "../pages/resident/PromotionsPage";
import ProfilePage from "../pages/resident/ProfilePage";
import SettingsPage from "../pages/resident/SettingsPage";
import ContactPage from "../pages/resident/ContactPage";

import AdminLoginPage from "../pages/admin/AdminLoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import MembersPage from "../pages/admin/MembersPage";
import MemberDetailPage from "../pages/admin/MemberDetailPage";
import SpendEntryPage from "../pages/admin/SpendEntryPage";
import NewsEditorPage from "../pages/admin/NewsEditorPage";
import PromotionsEditorPage from "../pages/admin/PromotionsEditorPage";
import BenefitsEditorPage from "../pages/admin/BenefitsEditorPage";

import { ResidentProtectedRoute } from "../components/guards/ResidentProtectedRoute";
import { AdminProtectedRoute } from "../components/guards/AdminProtectedRoute";
import { PublicOnlyRoute } from "../components/guards/PublicOnlyRoute";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/admin/login", element: <AdminLoginPage /> },
    ],
  },
  {
    element: <ResidentProtectedRoute />,
    children: [
      { path: "/home", element: <HomePage /> },
      { path: "/card", element: <CardPage /> },
      { path: "/card/qr", element: <QRPage /> },
      { path: "/points", element: <PointsPage /> },
      { path: "/benefits", element: <BenefitsPage /> },
      { path: "/more", element: <MorePage /> },
      { path: "/more/news", element: <NewsListPage /> },
      { path: "/more/promotions", element: <PromotionsPage /> },
      { path: "/more/profile", element: <ProfilePage /> },
      { path: "/more/settings", element: <SettingsPage /> },
      { path: "/more/contact", element: <ContactPage /> },
    ],
  },
  {
    element: <AdminProtectedRoute />,
    children: [
      { path: "/admin/dashboard", element: <DashboardPage /> },
      { path: "/admin/members", element: <MembersPage /> },
      { path: "/admin/members/:memberId", element: <MemberDetailPage /> },
      { path: "/admin/spend-entry", element: <SpendEntryPage /> },
      { path: "/admin/content/news", element: <NewsEditorPage /> },
      { path: "/admin/content/promotions", element: <PromotionsEditorPage /> },
      { path: "/admin/content/benefits", element: <BenefitsEditorPage /> },
    ],
  },
]);
