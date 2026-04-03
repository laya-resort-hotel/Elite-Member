import { NavLink } from "react-router-dom";
import { residentBottomNav } from "../../lib/constants/nav";

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {residentBottomNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "is-active" : ""}`
          }
        >
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
