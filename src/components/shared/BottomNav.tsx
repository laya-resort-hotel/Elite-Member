import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home' },
  { to: '/card', label: 'Card' },
  { to: '/points', label: 'Points' },
  { to: '/benefits', label: 'Benefits' },
  { to: '/profile', label: 'Profile' }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
