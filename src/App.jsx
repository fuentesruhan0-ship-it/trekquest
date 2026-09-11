import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
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
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App