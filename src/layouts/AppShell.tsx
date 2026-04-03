import { Link, Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/shared/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function AppShell() {
  const { pathname } = useLocation();
  const { role, setRole } = useAuth();

  const titleMap: Record<string, string> = {
    '/': 'Elite Black Card',
    '/card': 'My Card',
    '/points': 'My Points',
    '/benefits': 'Benefits',
    '/news': 'News & Promotions',
    '/profile': 'Profile'
  };

  return (
    <div className="app-bg">
      <div className="mobile-frame">
        <header className="topbar">
          <div>
            <div className="eyebrow">LAYA Resort Hotel</div>
            <h1>{titleMap[pathname] ?? 'Elite Black Card'}</h1>
          </div>
          <div className="topbar-actions">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="role-switcher"
              aria-label="Select role"
            >
              <option value="resident">Resident</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <Link className="ghost-link" to="/admin">
              Admin
            </Link>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
