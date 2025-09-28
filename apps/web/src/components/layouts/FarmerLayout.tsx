import { Outlet, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Package, LogOut } from 'lucide-react';
import { api } from '../../lib/api';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import socketService from '../../lib/socket';

export default function FarmerLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

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

  return (
    user?.role !== 'FARMER' ? <Navigate to="/" replace /> :
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-green-600">Agri-Connect</Link>
              <span className="ml-2 text-sm text-gray-500">Farmer Portal</span>
            </div>

            {/* Navigation (Farmer Portal) */}
            <nav className="hidden md:flex space-x-8">
              <NavLink to="/farmer/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                Dashboard
              </NavLink>
              <NavLink to="/farmer/products" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                Products
              </NavLink>
              <NavLink to="/farmer/orders" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                Orders
              </NavLink>
              <NavLink to="/farmer/analytics" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                Analytics
              </NavLink>
              <NavLink to="/farmer/profile" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600'}`}>
                Profile
              </NavLink>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
              
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
