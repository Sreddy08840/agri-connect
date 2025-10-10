import { Outlet, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Package, LogOut, MessageCircle, LayoutDashboard, ShoppingBag, BarChart3, User, Menu, X, Sprout, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import socketService from '../../lib/socket';
import FloatingChatButton from '../FloatingChatButton';

export default function FarmerLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!user?.id) return;
    const sock = socketService.connect();
    socketService.joinFarmerRoom(user.id);

    const onLow = (p: any) => toast(`Low stock: ${p.name} (${p.stockQty})`, { icon: '⚠️', id: `fl-${p.id}` });
    const onOos = (p: any) => toast.error(`Out of stock: ${p.name}`, { id: `fo-${p.id}` });

    socketService.getSocket()?.on('product:low-stock', onLow);
    socketService.getSocket()?.on('product:out-of-stock', onOos);

    return () => {
      socketService.getSocket()?.off('product:low-stock', onLow);
      socketService.getSocket()?.off('product:out-of-stock', onOos);
      socketService.leaveFarmerRoom(user.id);
    };
  }, [user?.id]);

  const navItems = [
    { to: '/farmer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/farmer/products', icon: Package, label: 'Products' },
    { to: '/farmer/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/farmer/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/farmer/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/farmer/profile', icon: User, label: 'Profile' },
  ];

  return (
    user?.role !== 'FARMER' ? <Navigate to="/" replace /> :
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-farmer-beige-50 to-farmer-green-50">
      {/* Top Header - Mobile & Desktop */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-20 px-4 lg:px-6">
          {/* Left: Menu Toggle & Logo */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2.5 text-gray-600 hover:text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-gray-600 hover:text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="h-12 w-12 bg-gradient-to-br from-farmer-green-500 via-farmer-green-600 to-farmer-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 bg-clip-text text-transparent">Agri-Connect</span>
                <span className="text-xs text-farmer-yellow-600 font-semibold">🚜 Farmer Portal</span>
              </div>
            </Link>
          </div>

          {/* Right: User Info & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-farmer-green-50 to-farmer-green-100 rounded-xl border border-farmer-green-200">
              <div className="h-10 w-10 bg-gradient-to-br from-farmer-green-500 to-farmer-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">{user?.name}</span>
                <span className="text-xs text-farmer-green-600 font-medium">Farmer Account</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              title="Logout"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:block fixed left-0 top-20 bottom-0 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-30 ${
        sidebarOpen ? 'w-72' : 'w-20'
      }`}>
        <nav className="h-full overflow-y-auto py-6 px-3">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-farmer-green-50 hover:text-farmer-green-700'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${sidebarOpen ? '' : 'mx-auto'}`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold text-sm flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </NavLink>
            ))}
          </div>
          
          {sidebarOpen && (
            <div className="mt-8 px-4 py-4 bg-gradient-to-br from-farmer-yellow-50 to-farmer-yellow-100 rounded-xl border border-farmer-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-8 w-8 bg-farmer-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💡</span>
                </div>
                <span className="text-sm font-bold text-gray-800">Quick Tip</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Keep your product inventory updated to attract more customers!
              </p>
            </div>
          )}
        </nav>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-farmer-green-500 to-farmer-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-800">Farmer Portal</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({isActive}) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-farmer-green-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
      }`}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
