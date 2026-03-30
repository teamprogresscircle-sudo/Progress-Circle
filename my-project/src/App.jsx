import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { GamificationProvider } from './context/GamificationContext';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy loading components for performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Habits = lazy(() => import('./pages/Habits').then(m => ({ default: m.Habits })));
const Info = lazy(() => import('./pages/Info').then(m => ({ default: m.Info })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Maintenance = lazy(() => import('./pages/Maintenance').then(m => ({ default: m.Maintenance })));
const Savings = lazy(() => import('./pages/Savings').then(m => ({ default: m.Savings })));
const Fitness = lazy(() => import('./pages/Fitness').then(m => ({ default: m.Fitness })));
const FocusMode = lazy(() => import('./pages/FocusMode').then(m => ({ default: m.FocusMode })));
const AvatarShop = lazy(() => import('./avatar/AvatarShop').then(m => ({ default: m.AvatarShop })));
const FocusFarm = lazy(() => import('./pages/FocusFarm').then(m => ({ default: m.FocusFarm })));
const Unlockables = lazy(() => import('./pages/Unlockables').then(m => ({ default: m.Unlockables })));
const Planner = lazy(() => import('./pages/Planner').then(m => ({ default: m.Planner })));
const Nutrition = lazy(() => import('./pages/Nutrition').then(m => ({ default: m.Nutrition })));
const Squad = lazy(() => import('./pages/Squad').then(m => ({ default: m.Squad })));
const Pricing = lazy(() => import('./pages/Pricing'));
const FocusBattleArena = lazy(() => import('./pages/FocusBattleArena'));
const SquadFocusArena = lazy(() => import('./pages/SquadFocusArena'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const SquadLeaderboard = lazy(() => import('./pages/SquadLeaderboard').then(m => ({ default: m.SquadLeaderboard })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();
  const [publicMaintenance, setPublicMaintenance] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/admin/status`);
        const data = await res.json();
        if (data.data?.maintenanceMode) setPublicMaintenance(true);
        else setPublicMaintenance(false);
      } catch (e) { /* Ignore */ }
    };
    
    checkStatus();
    
    // Performance: Poll less frequently (60s) or on route change instead of 30s interval
  }, [location.pathname]); // Re-check on route change
  
  // If system is in maintenance and user is not an admin, restrict all views except login
  const isMaintenanceMode = (user?.isMaintenance === true && !user?.isAdmin) || (publicMaintenance && !user?.isAdmin);

  if (isMaintenanceMode) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Maintenance />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={isAuthenticated ? <Navigate to="/" /> : <Suspense fallback={<LoadingSpinner />}><Landing /></Suspense>} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>} />
      <Route path="/maintenance" element={<Suspense fallback={<LoadingSpinner />}><Maintenance /></Suspense>} />

      <Route path="/" element={
        isAuthenticated 
          ? <PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></Layout></PrivateRoute>
          : <Suspense fallback={<LoadingSpinner />}><Landing /></Suspense>
      } />
      
      <Route path="/tasks" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Tasks /></Suspense></Layout></PrivateRoute>} />
      <Route path="/habits" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Habits /></Suspense></Layout></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Leaderboard /></Suspense></Layout></PrivateRoute>} />
      <Route path="/planner" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Planner /></Suspense></Layout></PrivateRoute>} />
      <Route path="/info" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Info /></Suspense></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Profile /></Suspense></Layout></PrivateRoute>} />
      <Route path="/social" element={<Navigate to="/squad" />} />
      <Route path="/savings" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Savings /></Suspense></Layout></PrivateRoute>} />
      <Route path="/fitness" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Fitness /></Suspense></Layout></PrivateRoute>} />
      <Route path="/nutrition" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Nutrition /></Suspense></Layout></PrivateRoute>} />
      <Route path="/squad" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Squad /></Suspense></Layout></PrivateRoute>} />
      <Route path="/focus" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><FocusMode /></Suspense></Layout></PrivateRoute>} />
      <Route path="/pricing" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Pricing /></Suspense></Layout></PrivateRoute>} />
      <Route path="/payment-success" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><PaymentSuccess /></Suspense></Layout></PrivateRoute>} />

      {/* Gamification */}
      <Route path="/avatar-shop" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><AvatarShop /></Suspense></Layout></PrivateRoute>} />
      <Route path="/farm" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><FocusFarm /></Suspense></Layout></PrivateRoute>} />
      <Route path="/milestones" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><Unlockables /></Suspense></Layout></PrivateRoute>} />

      <Route path="/admin" element={<AdminRoute><Layout><Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense></Layout></AdminRoute>} />
      <Route path="/battle/:id/*" element={<PrivateRoute><Suspense fallback={<LoadingSpinner />}><FocusBattleArena /></Suspense></PrivateRoute>} />
      <Route path="/squad/focus/:id" element={<PrivateRoute><Suspense fallback={<LoadingSpinner />}><SquadFocusArena /></Suspense></PrivateRoute>} />
      <Route path="/squad/leaderboard" element={<PrivateRoute><Layout><Suspense fallback={<LoadingSpinner />}><SquadLeaderboard /></Suspense></Layout></PrivateRoute>} />

      {/* Public Info Pages */}
      <Route path="/about" element={<Suspense fallback={<LoadingSpinner />}><About /></Suspense>} />
      <Route path="/privacy" element={<Suspense fallback={<LoadingSpinner />}><Privacy /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<LoadingSpinner />}><Terms /></Suspense>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <DataProvider>
            <GamificationProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                richColors
                expand={false}
                toastOptions={{
                  style: {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  },
                }}
              />
            </GamificationProvider>
          </DataProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;