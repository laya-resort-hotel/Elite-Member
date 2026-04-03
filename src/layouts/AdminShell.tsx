import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/members', label: 'Members' },
  { to: '/admin/scan', label: 'Scan Spend' },
  { to: '/admin/content', label: 'Content' }
];

export default function AdminShell() {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="eyebrow">Backend CMS</div>
          <h1>LAYA Resident Operations</h1>
        </div>
      </header>

      <nav className="admin-tabs">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}` }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
