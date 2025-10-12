import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery(
    'admin-dashboard-stats',
    async () => {
      try {
        const [users, productsMeta, pendingCount, orders] = await Promise.all([
          api.get('/users').then(res => res.data?.users || res.data || []),
          // Get total products via pagination.total (request minimal page)
          api.get('/products/admin/list', { params: { status: 'ALL', page: 1, limit: 1 } }).then(res => ({
            total: res.data?.pagination?.total ?? (Array.isArray(res.data?.products) ? res.data.products.length : (Array.isArray(res.data) ? res.data.length : 0))
          })),
          // Get pending review count directly from the endpoint
          api.get('/products/admin/pending/count').then(res => Number(res.data?.count || 0)),
          api.get('/orders').then(res => res.data?.orders || res.data || []),
        ]);
        
        return {
          totalUsers: users.length,
          totalFarmers: users.filter((u: any) => u.role === 'FARMER').length,
          totalCustomers: users.filter((u: any) => u.role === 'CUSTOMER').length,
          totalProducts: productsMeta.total,
          pendingProducts: pendingCount,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === 'PLACED' || o.status === 'CONFIRMED').length,
          completedOrders: orders.filter((o: any) => o.status === 'DELIVERED').length,
          totalRevenue: orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0),
        };
      } catch (error) {
        console.error('Dashboard API error:', error);
        throw error;
      }
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error: any) => {
        console.error('Dashboard query error:', error);
      }
    }
  );

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
          subtitle={`${stats?.totalFarmers || 0} Farmers, ${stats?.totalCustomers || 0} Customers`}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="bg-green-500"
          subtitle={`${stats?.pendingProducts || 0} pending review`}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="bg-purple-500"
          subtitle={`${stats?.pendingOrders || 0} pending`}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          subtitle={`${stats?.completedOrders || 0} completed orders`}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/products-review'}
              className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-orange-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Review Pending Products</p>
                <p className="text-sm text-gray-500">{stats?.pendingProducts || 0} products awaiting approval</p>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/orders'}
              className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Clock className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Pending Orders</p>
                <p className="text-sm text-gray-500">{stats?.pendingOrders || 0} orders need attention</p>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/users'}
              className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage farmers and customers</p>
              </div>
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-900">Order Fulfillment Rate</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats?.totalOrders ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-gray-900">Product Approval Rate</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats?.totalProducts ? Math.round(((stats.totalProducts - stats.pendingProducts) / stats.totalProducts) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-900">Active Users</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-gray-900">Avg Order Value</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ₹{stats?.totalOrders ? Math.round((stats.totalRevenue || 0) / stats.totalOrders) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Export</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.location.href = '/orders'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Export Orders
          </button>
          <button
            onClick={() => window.location.href = '/users'}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            Export Users
          </button>
          <button
            onClick={() => window.location.href = '/products-review'}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Export Products
          </button>
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Version</p>
            <p className="text-lg text-gray-900">v1.0.0</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-lg text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Environment</p>
            <p className="text-lg text-gray-900">Development</p>
          </div>
        </div>
      </div>
    </div>
  );
}
