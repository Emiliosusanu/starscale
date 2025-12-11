import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import StorePage from '@/pages/StorePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import SuccessPage from '@/pages/SuccessPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SettingsPage from '@/pages/SettingsPage';
import AuthCallback from '@/pages/AuthCallback';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { session, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#0A0A0A]">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (session && !profile) {
    return (
     <div className="w-full h-screen flex justify-center items-center bg-[#0A0A0A]">
       <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
     </div>
   );
 }

  return children;
};

const GuestRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#0A0A0A]">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  return session ? <Navigate to={from} replace /> : children;
};

function App() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />
            
            <Route path="order/:orderId" element={<CheckoutPage />} />
            
            <Route path="dashboard" element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } 
            />

             <Route path="settings" element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              } 
            />

            <Route path="success" element={<SuccessPage />} />
            <Route path="auth/callback" element={<AuthCallback />} />

            <Route 
              path="login" 
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              } 
            />
            <Route 
              path="register" 
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              } 
            />
          </Route>
        </Routes>
      </AnimatePresence>
      <Toaster />
    </>
  );
}

export default App;