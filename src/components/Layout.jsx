import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function Layout() {
  const location = useLocation();
  const isFullScreenMap = location.pathname === '/' || location.pathname === '/map';

  if (isFullScreenMap) {
    return (
      <div className="w-full h-[100dvh] overflow-hidden relative bg-black">
        <Outlet />
      </div>
    );
  }

  // Remove bottom navigation bar from menu screens: My Profile, Survival Manual, First Aid Guide, Backpacking
  const hideBottomNavRoutes = ['/profile', '/survival', '/first-aid', '/backpacking'];
  const hideBottomNav = hideBottomNavRoutes.includes(location.pathname);

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto bg-background relative flex flex-col shadow-2xl">
      <main className={`flex-1 overflow-y-auto no-scrollbar ${hideBottomNav ? 'pb-4' : 'pb-20'}`}>
        <Outlet />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}