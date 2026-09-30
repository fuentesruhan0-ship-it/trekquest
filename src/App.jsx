import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import InstallPwaModal from '@/components/InstallPwaModal';
import Home from '@/pages/Home';
import MapPage from '@/pages/MapPage';
import Weather from '@/pages/Weather';
import PlantScanner from '@/pages/PlantScanner';
import FirstAid from '@/pages/FirstAid';
import Survival from '@/pages/Survival';
import Backpacking from '@/pages/Backpacking';
import Music from '@/pages/Music';
import WaterReminder from '@/pages/WaterReminder';
import Journal from '@/pages/Journal';
import RestReminder from '@/pages/RestReminder';
import ActivityTracker from '@/pages/ActivityTracker';
import MountainTracker from '@/pages/MountainTracker';
import Compass from '@/pages/Compass';
import EmergencyCard from '@/pages/EmergencyCard';
import SafeReturn from '@/pages/SafeReturn';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  // Show loading spinner while Clerk initializes
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the routes with Clerk-protected routes
  return (
    <Routes>
      <Route path="/login/*" element={<Login />} />
      <Route path="/register/*" element={<Register />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/plant-scanner" element={<PlantScanner />} />
          <Route path="/first-aid" element={<FirstAid />} />
          <Route path="/survival" element={<Survival />} />
          <Route path="/backpacking" element={<Backpacking />} />
          <Route path="/music" element={<Music />} />
          <Route path="/water-reminder" element={<WaterReminder />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/rest-reminder" element={<RestReminder />} />
          <Route path="/activity" element={<ActivityTracker />} />
          <Route path="/mountain-tracker" element={<MountainTracker />} />
          <Route path="/compass" element={<Compass />} />
          <Route path="/emergency" element={<EmergencyCard />} />
          <Route path="/safe-return" element={<SafeReturn />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <InstallPwaModal />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;