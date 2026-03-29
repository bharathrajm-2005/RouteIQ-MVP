import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import NLQueryWidget from './components/NLQueryWidget';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DispatchPage from './pages/DispatchPage';
import AlertsPage from './pages/AlertsPage';
import CarbonDashboard from './pages/CarbonDashboard';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? 'ml-64 min-h-screen' : 'min-h-screen'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dispatch" element={<ProtectedRoute><DispatchPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/carbon" element={<ProtectedRoute><CarbonDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {isAuthenticated && <NLQueryWidget />}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-slate-800 !text-white !border !border-slate-700',
          duration: 3000,
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
