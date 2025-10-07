import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { ShoppingCart, User, LogOut, HelpCircle, MessageCircle, Menu, X, Sprout, ChevronDown, UserPlus, Tractor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import Footer from '../shared/Footer';
import LanguageSwitcher from '../LanguageSwitcher';
import { useState, useRef, useEffect } from 'react';

export default function MainLayout() {
  const { user, clearUser } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signUpDropdownOpen, setSignUpDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const signUpDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (signUpDropdownRef.current && !signUpDropdownRef.current.contains(event.target as Node)) {
        setSignUpDropdownOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farmer-beige-50 via-white to-farmer-green-50">
      {/* Header - Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-14 w-14 bg-gradient-to-br from-farmer-green-500 via-farmer-green-600 to-farmer-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                  <Sprout className="h-7 w-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 bg-clip-text text-transparent">Agri-Connect</span>
                  <span className="text-xs text-gray-500 font-medium">Farm to Table</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink to="/" className={({isActive}) => `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/products" className={({isActive}) => `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                {t('nav.products')}
              </NavLink>
              {user && (
                <>
                  <NavLink to="/orders" className={({isActive}) => `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                    {t('nav.orders')}
                  </NavLink>
                  <NavLink to="/messages" className={({isActive}) => `flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/help" className={({isActive}) => `flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </NavLink>
              {user?.role === 'FARMER' && (
                <NavLink to="/farmer" className={({isActive}) => `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-farmer-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-farmer-green-600'}`}>
                  {t('nav.farmerPortal')}
                </NavLink>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              
              {/* Cart */}
              <Link to="/cart" className="relative p-3 text-gray-600 hover:text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl transition-all duration-200 group">
                <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  {/* User Profile */}
                  <Link 
                    to="/profile" 
                    className="hidden lg:flex items-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 bg-gradient-to-br from-farmer-green-500 to-farmer-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  
                  {/* Mobile Profile Icon */}
                  <Link to="/profile" className="lg:hidden p-3 text-gray-600 hover:text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl transition-all duration-200">
                    <User className="h-5 w-5" />
                  </Link>
                  
                  {/* Logout */}
                  <button 
                    className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="hidden lg:flex items-center space-x-2">
                  {/* Login Dropdown */}
                  <div className="relative" ref={loginDropdownRef}>
                    <button
                      onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                      className="flex items-center space-x-1 px-5 py-2.5 text-gray-700 hover:text-farmer-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
                    >
                      <span>Login</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {loginDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link
                          to="/login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-farmer-green-50 transition-colors group"
                        >
                          <div className="p-2 bg-farmer-green-100 rounded-lg group-hover:bg-farmer-green-200 transition-colors">
                            <User className="h-5 w-5 text-farmer-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Customer</div>
                            <div className="text-xs text-gray-500">Shop for produce</div>
                          </div>
                        </Link>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <Link
                          to="/farmer-login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-farmer-yellow-50 transition-colors group"
                        >
                          <div className="p-2 bg-farmer-yellow-100 rounded-lg group-hover:bg-farmer-yellow-200 transition-colors">
                            <Tractor className="h-5 w-5 text-farmer-yellow-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Farmer</div>
                            <div className="text-xs text-gray-500">Manage your farm</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Sign Up Dropdown */}
                  <div className="relative" ref={signUpDropdownRef}>
                    <button
                      onClick={() => setSignUpDropdownOpen(!signUpDropdownOpen)}
                      className="flex items-center space-x-1 px-5 py-2.5 bg-farmer-green-600 text-white font-semibold rounded-xl hover:bg-farmer-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <span>Sign Up</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${signUpDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {signUpDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link
                          to="/register"
                          onClick={() => setSignUpDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-farmer-green-50 transition-colors group"
                        >
                          <div className="p-2 bg-farmer-green-100 rounded-lg group-hover:bg-farmer-green-200 transition-colors">
                            <UserPlus className="h-5 w-5 text-farmer-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Customer</div>
                            <div className="text-xs text-gray-500">Buy fresh produce</div>
                          </div>
                        </Link>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <Link
                          to="/farmer-register"
                          onClick={() => setSignUpDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-farmer-yellow-50 transition-colors group"
                        >
                          <div className="p-2 bg-farmer-yellow-100 rounded-lg group-hover:bg-farmer-yellow-200 transition-colors">
                            <Tractor className="h-5 w-5 text-farmer-yellow-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Farmer</div>
                            <div className="text-xs text-gray-500">Sell your products</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-3 text-gray-600 hover:text-farmer-green-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              <NavLink 
                to="/" 
                className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </NavLink>
              <NavLink 
                to="/products" 
                className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.products')}
              </NavLink>
              {user && (
                <>
                  <NavLink 
                    to="/orders" 
                    className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.orders')}
                  </NavLink>
                  <NavLink 
                    to="/messages" 
                    className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </NavLink>
                </>
              )}
              <NavLink 
                to="/help" 
                className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </NavLink>
              {user?.role === 'FARMER' && (
                <NavLink 
                  to="/farmer" 
                  className={({isActive}) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-farmer-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.farmerPortal')}
                </NavLink>
              )}
              {!user && (
                <>
                  <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Login As
                  </div>
                  
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-3 mx-2 px-4 py-3 rounded-xl text-sm font-semibold bg-farmer-green-50 text-farmer-green-700 hover:bg-farmer-green-100 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Customer</div>
                      <div className="text-xs text-gray-600">Shop for produce</div>
                    </div>
                  </Link>
                  
                  <Link 
                    to="/farmer-login" 
                    className="flex items-center space-x-3 mx-2 px-4 py-3 rounded-xl text-sm font-semibold bg-farmer-yellow-50 text-farmer-yellow-700 hover:bg-farmer-yellow-100 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Tractor className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Farmer</div>
                      <div className="text-xs text-gray-600">Manage your farm</div>
                    </div>
                  </Link>
                  
                  <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sign Up As
                  </div>
                  
                  <Link 
                    to="/register" 
                    className="flex items-center space-x-3 mx-2 px-4 py-3 rounded-xl text-sm font-semibold bg-farmer-green-50 text-farmer-green-700 hover:bg-farmer-green-100 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Customer</div>
                      <div className="text-xs text-gray-600">Buy fresh produce</div>
                    </div>
                  </Link>
                  
                  <Link 
                    to="/farmer-register" 
                    className="flex items-center space-x-3 mx-2 px-4 py-3 rounded-xl text-sm font-semibold bg-farmer-yellow-50 text-farmer-yellow-700 hover:bg-farmer-yellow-100 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Tractor className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Farmer</div>
                      <div className="text-xs text-gray-600">Sell your products</div>
                    </div>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
