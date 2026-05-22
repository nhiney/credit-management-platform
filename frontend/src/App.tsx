import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import PackageStorePage from '@/pages/PackageStore';
import FeaturesPage from '@/pages/Features';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminPackagesPage from '@/pages/admin/AdminPackages';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import Navbar from '@/components/layout/Navbar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user, logout, refreshUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {isAuthenticated && <Navbar user={user} onLogout={logout} />}

      <Routes>
        {/* Auth */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />

        {/* User routes */}
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
        <Route
          path="/features"
          element={
            <ProtectedRoute>
              <FeaturesPage user={user} onRefreshUser={refreshUser} />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <AdminRoute>
              <AdminPackagesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <AdminRoute>
              <AdminTransactions />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
