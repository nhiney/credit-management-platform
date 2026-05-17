import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import PackageStorePage from '@/pages/PackageStore';
import Navbar from '@/components/layout/Navbar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user, logout, refreshUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {isAuthenticated && (
        <Navbar user={user} onLogout={logout} />
      )}

      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage onCreditRefresh={refreshUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/packages"
          element={
            <ProtectedRoute>
              <PackageStorePage onPurchaseSuccess={refreshUser} />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
