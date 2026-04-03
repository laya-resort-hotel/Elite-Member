import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../../lib/constants/routes";

type AdminShellProps = {
  title: string;
  children: ReactNode;
};

const adminNavItems = [
  { label: "Dashboard", to: ADMIN_ROUTES.DASHBOARD },
  { label: "Members", to: ADMIN_ROUTES.MEMBERS },
  { label: "Scan & Spend", to: ADMIN_ROUTES.SPEND_ENTRY },
  { label: "News", to: ADMIN_ROUTES.NEWS_EDITOR },
  { label: "Promotions", to: ADMIN_ROUTES.PROMOTION_EDITOR },
  { label: "Benefits", to: ADMIN_ROUTES.BENEFIT_EDITOR },
];

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <p className="admin-sidebar__eyebrow">LAYA Resident</p>
          <h2>Admin Console</h2>
        </div>

        <nav className="admin-sidebar__nav">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar__link ${isActive ? "is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-main__header">
          <div>
            <p className="admin-main__eyebrow">Operations & CMS</p>
            <h1>{title}</h1>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
