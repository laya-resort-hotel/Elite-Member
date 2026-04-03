import { Link, Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/shared/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useMock } from '../lib/firebase';

export default function AppShell() {
  const { pathname } = useLocation();
  const { role, logout, setDemoRole, user } = useAuth();

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
            <div className="muted small-line">{user?.displayName || user?.email}</div>
          </div>
          <div className="topbar-actions">
            {useMock ? (
              <select
                value={role}
                onChange={(e) => setDemoRole(e.target.value as typeof role)}
                className="role-switcher"
                aria-label="Select role"
              >
                <option value="resident">Resident</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            ) : null}
            {(role === 'staff' || role === 'manager' || role === 'admin') ? (
              <Link className="ghost-link" to="/admin">
                Admin
              </Link>
            ) : null}
            <button className="ghost-link button-reset" type="button" onClick={() => void logout()}>
              Sign out
            </button>
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
