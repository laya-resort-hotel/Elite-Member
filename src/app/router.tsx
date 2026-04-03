import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import AdminShell from '../layouts/AdminShell';
import HomePage from '../pages/resident/HomePage';
import CardPage from '../pages/resident/CardPage';
import PointsPage from '../pages/resident/PointsPage';
import BenefitsPage from '../pages/resident/BenefitsPage';
import NewsPage from '../pages/resident/NewsPage';
import ProfilePage from '../pages/resident/ProfilePage';
import DashboardPage from '../pages/admin/DashboardPage';
import MembersPage from '../pages/admin/MembersPage';
import ScanSpendPage from '../pages/admin/ScanSpendPage';
import ContentPage from '../pages/admin/ContentPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'card', element: <CardPage /> },
      { path: 'points', element: <PointsPage /> },
      { path: 'benefits', element: <BenefitsPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'profile', element: <ProfilePage /> }
    ]
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allow={['staff', 'manager', 'admin']}>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'scan', element: <ScanSpendPage /> },
      { path: 'content', element: <ContentPage /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
