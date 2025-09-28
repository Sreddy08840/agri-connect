import { useQuery } from 'react-query';
import { api } from '../../lib/api';
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';

export default function FarmerAnalyticsPage() {
  const { data: myProducts } = useQuery(
    ['farmer-products'],
    () => api.get('/products/mine/list').then(res => res.data),
  );

  const { data: myOrders } = useQuery(
    ['farmer-orders-summary'],
    () => api.get('/orders?mine=farmer&limit=5').then(res => res.data).catch(() => ({ orders: [], pagination: {} })),
  );

  const productCount = myProducts?.products?.length || 0;
  const orderCount = myOrders?.orders?.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{productCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{orderCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Earnings (demo)</p>
              <p className="text-2xl font-semibold text-gray-900">₹0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating (demo)</p>
              <p className="text-2xl font-semibold text-gray-900">4.5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Trends (Demo)</h2>
        </div>
        <div className="p-6 text-gray-500">Charts coming soon.</div>
      </div>
    </div>
  );
}
