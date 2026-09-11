import { NavLink } from 'react-router-dom';
import { Home, Map, BookOpen, UserRound } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function BottomNav() {
  return (
    <nav className="absolute bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-[1000]">
      <div className="flex items-stretch justify-around h-16">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}