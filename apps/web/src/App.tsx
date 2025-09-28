import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import { api } from './lib/api';
import { getRedirectPath } from './utils/auth';
import './utils/cartDebug'; // Import cart debugging utilities

// Pages
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerLoginPage from './pages/FarmerLoginPage';
import FarmerRegisterPage from './pages/FarmerRegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

// Support Pages
import HelpCenterPage from './pages/support/HelpCenterPage';
import PrivacyPolicyPage from './pages/support/PrivacyPolicyPage';
import TermsConditionsPage from './pages/support/TermsConditionsPage';
import FAQPage from './pages/support/FAQPage';
import ContactSupportPage from './pages/support/ContactSupportPage';

// Farmer Pages
import FarmerDashboard from './pages/farmer/DashboardPage';
import FarmerProductsPage from './pages/farmer/ProductsPage';
import FarmerOrdersPage from './pages/farmer/OrdersPage';
import FarmerAnalyticsPage from './pages/farmer/AnalyticsPage';


// Layouts
import MainLayout from './components/layouts/MainLayout';
import FarmerLayout from './components/layouts/FarmerLayout';

function App() {
  const { user, setUser, clearUser, isLoading, setLoading, isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setLoading(true);
      // Verify token and get user data
      api.get('/auth/me')
        .then((response) => {
          setUser(response.data);
          setInitialized(true);
        })
        .catch(() => {
          clearUser();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple role-based guards
  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const RequireRole = ({ role, children }: { role: 'FARMER'; children: JSX.Element }) => {
    if (!user) {
      // Redirect to appropriate login page based on role
      const loginPath = role === 'FARMER' ? '/farmer-login' : '/login';
      return <Navigate to={loginPath} replace />;
    }
    if (user.role !== role) {
      // Redirect to appropriate dashboard or home based on user's actual role
      const redirectPath = getRedirectPath(user);
      return <Navigate to={redirectPath} replace />;
    }
    return children;
  };

  // Prevent authenticated users from accessing login pages
  const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
    if (user) {
      const redirectPath = getRedirectPath(user);
      return <Navigate to={redirectPath} replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Public + Customer Routes */}
      <Route path="/" element={<MainLayout />}>
        {/* Landing is public */}
        <Route index element={<LandingPage />} />
        {/* Shopping pages are public (you can lock down later if needed) */}
        <Route path="home" element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        {/* Auth-only customer pages */}
        <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><CustomerProfilePage /></RequireAuth>} />
        {/* Support Pages */}
        <Route path="support/help-center" element={<HelpCenterPage />} />
        <Route path="support/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="support/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="support/faq" element={<FAQPage />} />
        <Route path="support/contact" element={<ContactSupportPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />

      {/* Farmer Auth - Completely Separate (No Customer Elements) */}
      <Route path="/farmer-login" element={<RedirectIfAuthenticated><FarmerLoginPage /></RedirectIfAuthenticated>} />
      <Route path="/farmer-register" element={<RedirectIfAuthenticated><FarmerRegisterPage /></RedirectIfAuthenticated>} />

      {/* Farmer Dashboard Routes */}
      <Route path="/farmer" element={<RequireRole role="FARMER"><FarmerLayout /></RequireRole>}>
        <Route index element={<Navigate to="/farmer/dashboard" replace />} />
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="products" element={<FarmerProductsPage />} />
        <Route path="orders" element={<FarmerOrdersPage />} />
        <Route path="analytics" element={<FarmerAnalyticsPage />} />
        <Route path="profile" element={<FarmerProfilePage />} />
      </Route>

    </Routes>
  );
}

export default App;
