import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import { api } from './lib/api';

// Enhanced Pages
import EnhancedLoginPage from './pages/EnhancedLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import EnhancedUsersPage from './pages/EnhancedUsersPage';
import ProductsReviewPage from './pages/ProductsReviewPage';
import EnhancedOrdersPage from './pages/EnhancedOrdersPage';
import SettingsPage from './pages/SettingsPage';
import SystemCleanupPage from './pages/SystemCleanupPage';
import ApiTestPage from './pages/ApiTestPage';
import AuthTestPage from './pages/AuthTestPage';

// Enhanced Layout
import EnhancedAdminLayout from './components/EnhancedAdminLayout';

function App() {
  const { user, setUser, clearUser, isLoading, setLoading, isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    // Check if admin is logged in on app start
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setLoading(true);
      // Verify token and get admin data
      api.get('/auth/me')
        .then((response) => {
          const userData = response.data;
          // Verify admin role
          if (userData.role === 'ADMIN') {
            setUser(userData);
          } else {
            clearUser();
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            delete api.defaults.headers.common['Authorization'];
          }
        })
        .catch(() => {
          clearUser();
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          // IMPORTANT: always clear loading and mark app initialized
          setLoading(false);
          setInitialized(true);
        });
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, [setUser, clearUser, setLoading, setInitialized]);

  // Loading screen while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  // Admin authentication guard
  const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    if (!user || user.role !== 'ADMIN') {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Prevent authenticated admins from accessing login page
  const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
    if (user && user.role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Login Routes */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <EnhancedLoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RedirectIfAuthenticated>
            <ForgotPasswordPage />
          </RedirectIfAuthenticated>
        }
      />
      
      {/* Admin Dashboard Routes */}
      <Route 
        path="/" 
        element={
          <RequireAdmin>
            <EnhancedAdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<EnhancedUsersPage />} />
        <Route path="products-review" element={<ProductsReviewPage />} />
        <Route path="orders" element={<EnhancedOrdersPage />} />
        <Route path="cleanup" element={<SystemCleanupPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="api-test" element={<ApiTestPage />} />
        <Route path="auth-test" element={<AuthTestPage />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
