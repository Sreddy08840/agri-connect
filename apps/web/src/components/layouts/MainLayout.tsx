import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import Footer from '../shared/Footer';
import LanguageSwitcher from '../LanguageSwitcher';

export default function MainLayout() {
  const { user, clearUser } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AC</span>
                </div>
                <span className="text-2xl font-bold text-green-600">Agri-Connect</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <NavLink to="/" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/products" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                {t('nav.products')}
              </NavLink>
              {user && (
                <NavLink to="/orders" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                  {t('nav.orders')}
                </NavLink>
              )}
              {user?.role === 'FARMER' && (
                <NavLink to="/farmer" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                  {t('nav.farmerPortal')}
                </NavLink>
              )}
              {!user && (
                <Link 
                  to="/farmer-register" 
                  className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium transition-colors"
                >
                  {t('nav.joinAsFarmer')}
                </Link>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Link to="/cart" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <ShoppingCart className="h-5 w-5" />
                {/* Cart item count badge */}
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {getTotalItems()}
                  </span>
                )}
              </Link>

              {user && (
                <>
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </Link>
                  <button 
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
