import { Link } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import { RESIDENT_ROUTES } from "../../lib/constants/routes";

const menuItems = [
  {
    title: "News",
    description: "Latest updates and resident announcements",
    to: RESIDENT_ROUTES.NEWS,
  },
  {
    title: "Promotions",
    description: "Exclusive offers and seasonal privileges",
    to: RESIDENT_ROUTES.PROMOTIONS,
  },
  {
    title: "Profile",
    description: "Member information and contact details",
    to: RESIDENT_ROUTES.PROFILE,
  },
  {
    title: "Settings",
    description: "Language, notifications, and preferences",
    to: RESIDENT_ROUTES.SETTINGS,
  },
  {
    title: "Contact",
    description: "Resident services and hotel contact options",
    to: RESIDENT_ROUTES.CONTACT,
  },
];

export default function MorePage() {
  return (
    <AppShell title="More">
      <div className="page-stack">
        <section className="more-grid">
          {menuItems.map((item) => (
            <Link key={item.to} to={item.to} className="more-tile">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="more-tile__arrow">→</span>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
