import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Shield, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  AlertTriangle,
  Wrench,
  Activity,
  Key
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import adminSocket from '../lib/socket';

export default function EnhancedAdminLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview of your Agri-Connect platform' },
    { name: 'Users', href: '/users', icon: Users, description: 'Manage users, verification status, and impersonation' },
    { name: 'Products Review', href: '/products-review', icon: Package, description: 'Review and approve farmer products' },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, description: 'Monitor and manage customer orders' },
    { name: 'System Cleanup', href: '/cleanup', icon: Wrench, description: 'System maintenance and cleanup tools' },
    { name: 'API Test', href: '/api-test', icon: Activity, description: 'Test API connectivity and endpoints' },
    { name: 'Auth Test', href: '/auth-test', icon: Key, description: 'Test authentication and authorization' },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'Configure admin panel settings' },
  ];

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentPath = location.pathname;
    const currentPage = navigation.find(item => item.href === currentPath);
    return currentPage || { name: 'Admin Panel', icon: Shield, description: 'Administrative control panel' };
  };

  const currentPageInfo = getCurrentPageInfo();

  // Global socket listeners for stock alerts
  useEffect(() => {
    const sock = adminSocket.connect();
    adminSocket.joinAdminRoom();

    const onLow = (p: any) => toast.error(`Low stock: ${p.name} (${p.stockQty})`, { id: `low-${p.id}` });
    const onOos = (p: any) => toast(`Out of stock: ${p.name}`, { icon: '⚠️', id: `oos-${p.id}` });

    const s = adminSocket as any;
    s.getSocket?.()?.on('product:low-stock', onLow);
    s.getSocket?.()?.on('product:out-of-stock', onOos);

    return () => {
      s.getSocket?.()?.off('product:low-stock', onLow);
      s.getSocket?.()?.off('product:out-of-stock', onOos);
      adminSocket.leaveAdminRoom();
    };
  }, []);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  // Check if admin is impersonating another user
  const hasAdminSnapshot = typeof window !== 'undefined' && !!sessionStorage.getItem('admin_accessToken');
  
  const handleReturnToAdmin = () => {
    try {
      const at = sessionStorage.getItem('admin_accessToken');
      const rt = sessionStorage.getItem('admin_refreshToken');
      if (at && rt) {
        localStorage.setItem('adminAccessToken', at);
        localStorage.setItem('adminRefreshToken', rt);
        api.defaults.headers.common['Authorization'] = `Bearer ${at}`;
      }
    } catch (e) {
      console.error('Failed to restore admin tokens:', e);
    }
    
    // Clear impersonation tokens
    sessionStorage.removeItem('admin_accessToken');
    sessionStorage.removeItem('admin_refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to admin portal
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500" />
            <span className="ml-2 text-white font-semibold">Admin Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Vertical nav (scrollable) */}
        <nav className="mt-4 flex-1 overflow-y-auto">
          <div className="px-4 space-y-2 pb-28">{/* extra bottom padding for footer */}
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 bg-gray-800">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">{user?.phone}</p>
            </div>
          </div>
          
          {hasAdminSnapshot && (
            <button
              onClick={handleReturnToAdmin}
              className="w-full mb-2 px-4 py-2 text-sm text-amber-300 bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors"
            >
              Return to Admin
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Horizontal nav (small screens) */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="px-3 py-2 overflow-x-auto">
            <div className="flex space-x-2 snap-x snap-mandatory">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `shrink-0 snap-start whitespace-nowrap px-3 py-2 text-sm rounded-md border ${
                      isActive ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200'
                    }`
                  }
                >
                  <span className="inline-flex items-center">
                    <item.icon className="h-4 w-4 mr-1" />
                    {item.name}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
        {/* Impersonation Banner */}
        {hasAdminSnapshot && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                <div className="text-sm text-amber-800">
                  <strong>You are impersonating a user.</strong> Actions you take will be performed as the impersonated user.
                </div>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="px-3 py-1 text-xs border border-amber-300 rounded text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Return to Admin
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo and title */}
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-red-600">
                  Agri-Connect
                </Link>
                <span className="ml-2 text-sm text-gray-500">Admin Panel</span>
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{user?.name || 'Admin'}</span>
                </div>
                
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <currentPageInfo.icon className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPageInfo.name}</h1>
                <p className="text-gray-600">{currentPageInfo.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
