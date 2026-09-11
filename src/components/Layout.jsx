import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function Layout() {
  return (
    <div className="min-h-[100dvh] max-w-md mx-auto bg-background relative flex flex-col shadow-2xl">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}