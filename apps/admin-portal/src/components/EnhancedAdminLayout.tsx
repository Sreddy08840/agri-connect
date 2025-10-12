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
  Key,
  Search,
  Bell,
  ChevronRight,
  Home,
  UserCheck,
  FileText,
  Database,
  MessageCircle
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
  const [searchQuery, setSearchQuery] = useState('');

  // Organized navigation with sections
  const navigationSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Platform overview and analytics', badge: null },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Users', href: '/users', icon: Users, description: 'User management and verification', badge: null },
        { name: 'Products Review', href: '/products-review', icon: Package, description: 'Review farmer products', badge: null },
        { name: 'Orders', href: '/orders', icon: ShoppingCart, description: 'Monitor customer orders', badge: null },
        { name: 'Support Chat', href: '/support-chat', icon: MessageCircle, description: 'Live chat support', badge: null },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'System Cleanup', href: '/cleanup', icon: Wrench, description: 'Maintenance tools', badge: null },
        { name: 'API Test', href: '/api-test', icon: Activity, description: 'Test connectivity', badge: null },
        { name: 'Auth Test', href: '/auth-test', icon: Key, description: 'Test authentication', badge: null },
        { name: 'Settings', href: '/settings', icon: Settings, description: 'Admin configuration', badge: null },
      ]
    }
  ];

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentPath = location.pathname;
    for (const section of navigationSections) {
      const item = section.items.find(item => item.href === currentPath);
      if (item) return item;
    }
    return { name: 'Admin Panel', icon: Shield, description: 'Administrative control panel' };
  };

  const currentPageInfo = getCurrentPageInfo();

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', href: '/dashboard', icon: Home }];

    if (pathSegments.length > 1) {
      const currentSegment = pathSegments[pathSegments.length - 1];
      breadcrumbs.push({
        name: currentPageInfo.name,
        href: location.pathname,
        icon: currentPageInfo.icon
      });
    }

    return breadcrumbs;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
              <p className="text-xs text-red-100">Agri-Connect Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        location.pathname === item.href
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-700/50 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                      }`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs ${location.pathname === item.href ? 'text-red-100' : 'text-gray-400'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || user?.phone}</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </div>
          </div>

          {hasAdminSnapshot && (
            <button
              onClick={handleReturnToAdmin}
              className="w-full mb-3 px-4 py-2.5 text-sm font-medium text-amber-300 bg-amber-900/50 hover:bg-amber-800/70 rounded-lg transition-all duration-200 border border-amber-600/30"
            >
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Return to Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/70 rounded-lg transition-all duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-80 flex flex-col min-h-screen">
        {/* Impersonation Banner */}
        {hasAdminSnapshot && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-sm font-medium">
                  <strong>Impersonation Mode:</strong> Actions performed as the impersonated user
                </div>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 font-medium"
              >
                Return to Admin
              </button>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Mobile menu button & breadcrumbs */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <Menu className="h-6 w-6" />
                </button>

                {/* Breadcrumbs */}
                <nav className="hidden sm:flex items-center space-x-2 text-sm">
                  {getBreadcrumbs().map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
                      <Link
                        to={crumb.href}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                          index === getBreadcrumbs().length - 1
                            ? 'bg-red-50 text-red-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <crumb.icon className="h-4 w-4" />
                        <span>{crumb.name}</span>
                      </Link>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Right side - Search & User actions */}
              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className="hidden md:flex items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search admin panel..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${location.pathname === '/dashboard' ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <currentPageInfo.icon className={`h-8 w-8 ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentPageInfo.name}</h1>
                  <p className="text-gray-600 mt-1">{currentPageInfo.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
