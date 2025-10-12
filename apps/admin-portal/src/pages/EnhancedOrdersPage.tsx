import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Download,
  User,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';

type OrderStatus = 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type OrderItem = {
  id: string;
  product: { 
    name: string; 
    images?: string | null;
    price: number;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  totalAmount?: number; // For backward compatibility
  paymentMethod: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  addressSnapshot?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer: { 
    id: string;
    name: string | null; 
    phone: string;
  };
  farmer: { 
    id: string;
    businessName: string | null; 
    user: { 
      name: string | null; 
      phone: string;
    };
  };
};

export default function EnhancedOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders with React Query
  const { data, isLoading, error } = useQuery(
    ['admin-orders', status, q, page],
    async () => {
      const params: any = { page, limit: 20 };
      if (status) params.status = status;
      if (q) params.q = q;
      const res = await api.get('/orders', { params });
      return res.data;
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Order Number', 'Customer Name', 'Customer Phone', 'Farmer Business', 'Status', 'Total Amount', 'Payment Method', 'Order Date'];
      const csvRows = [headers.join(',')];

      orders.forEach((order: any) => {
        const row = [
          order?.orderNumber || '',
          order?.customer?.name || 'N/A',
          order?.customer?.phone || 'N/A',
          order?.farmer?.businessName || 'N/A',
          order?.status || 'N/A',
          Number(order?.total || order?.totalAmount || 0).toFixed(2),
          order?.paymentMethod || 'N/A',
          order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'
        ];
        csvRows.push(row.map(cell => `"${cell}"`).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Orders exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const handleExportJSON = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    try {
      const jsonContent = JSON.stringify(orders, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Orders exported as JSON successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PACKED':
        return 'bg-purple-100 text-purple-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return <Clock className="h-4 w-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'PACKED':
        return <Package className="h-4 w-4" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />;
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getImageUrl = (images: string | null) => {
    if (!images) return null;
    try {
      const imageArray = JSON.parse(images);
      const first = imageArray?.[0];
      if (!first) return null;
      return String(first).startsWith('http') ? String(first) : `http://localhost:8080${first}`;
    } catch {
      return String(images).startsWith('http') ? String(images) : `http://localhost:8080${images}`;
    }
  };

  // Normalize API response shapes safely
  const normalizeOrdersData = (d: any): { orders: any[]; pagination: any } => {
    try {
      if (!d) return { orders: [], pagination: { pages: 1 } };
      if (Array.isArray(d)) return { orders: d, pagination: { pages: 1 } };
      if (Array.isArray(d?.orders)) return { orders: d.orders, pagination: d.pagination || { pages: 1 } };
      if (d?.data) {
        if (Array.isArray(d.data)) return { orders: d.data, pagination: { pages: 1 } };
        if (Array.isArray(d.data?.orders)) return { orders: d.data.orders, pagination: d.data.pagination || { pages: 1 } };
      }
      return { orders: [], pagination: { pages: 1 } };
    } catch {
      return { orders: [], pagination: { pages: 1 } };
    }
  };

  const { orders, pagination } = normalizeOrdersData(data);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const errorStatus = (error as any)?.response?.status;
    const errorMessage = (error as any)?.response?.data?.error || (error as any)?.message || 'Unknown error';
    
    // If it's an authentication error, show login prompt
    if (errorStatus === 401) {
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-yellow-800 font-medium">Authentication Required</h3>
            <p className="text-yellow-600 text-sm mt-2">You need to log in to access the orders page.</p>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Failed to Load Orders</h3>
          <p className="text-red-600 text-sm mt-2">Error: {errorMessage}</p>
          {errorStatus && (
            <p className="text-red-600 text-sm">Status Code: {errorStatus}</p>
          )}
          <div className="mt-3 space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/api-test'} 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Test API Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportCSV}
          disabled={!orders || orders.length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={!orders || orders.length === 0}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order number, customer, or farmer"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Status</option>
                <option value="PLACED">Placed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(orders) && orders.map((order: any, index: number) => (
                <tr key={order?.id ?? index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          #{order?.orderNumber ?? '—'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(order?.items?.length ?? 0)} item{(order?.items?.length ?? 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order?.customer?.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order?.customer?.phone || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order?.farmer?.businessName || 'No business name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order?.farmer?.user?.phone || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((order?.status ?? 'PLACED') as OrderStatus)}`}>
                      {getStatusIcon((order?.status ?? 'PLACED') as OrderStatus)}
                      <span className="ml-1">{order?.status ?? 'PLACED'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{Number(order?.total ?? order?.totalAmount ?? 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order?.paymentMethod || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order as Order)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {q || status ? 'Try adjusting your search criteria.' : 'No orders have been placed yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-md">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="inline-block w-1.5 h-5 bg-red-500 rounded mr-2" />
                      Order Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">#{selectedOrder?.orderNumber ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((selectedOrder?.status ?? 'PLACED') as OrderStatus)}`}>
                          {getStatusIcon((selectedOrder?.status ?? 'PLACED') as OrderStatus)}
                          <span className="ml-1">{selectedOrder?.status ?? 'PLACED'}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-gray-900">₹{Number(selectedOrder?.total ?? selectedOrder?.totalAmount ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{selectedOrder?.paymentMethod || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-4 rounded-lg border border-gray-200 shadow-md bg-white">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="inline-block w-1.5 h-5 bg-red-500 rounded mr-2" />
                      <User className="h-4 w-4 mr-2" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedOrder?.customer?.name || 'No name'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>{selectedOrder?.customer?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Farmer Info */}
                  <div className="p-4 rounded-lg border border-gray-200 shadow-md bg-white">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="inline-block w-1.5 h-5 bg-red-500 rounded mr-2" />
                      <Package className="h-4 w-4 mr-2" />
                      Farmer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business:</span>
                        <span>{selectedOrder?.farmer?.businessName || 'No business name'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span>{selectedOrder?.farmer?.user?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder?.items) && selectedOrder.items.map((item, index) => (
                      <div key={index} className="group flex items-center space-x-4 p-3 bg-white rounded-lg border shadow-sm hover:shadow-md hover:border-red-200 transition">
                        <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center overflow-hidden border" title={`${item?.product?.name ?? ''} | Qty: ${Number(item?.quantity ?? 0)} ${item?.product?.unit ?? ''} | Price: ₹${Number(item?.unitPrice ?? 0).toFixed(2)}`}>
                          {getImageUrl(item?.product?.images ?? null) ? (
                            <img
                              src={getImageUrl(item?.product?.images ?? null)!}
                              alt={item?.product?.name ?? 'Product'}
                              className="w-full h-full object-cover opacity-100"
                              loading="lazy"
                              onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="h-7 w-7 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item?.product?.name ?? '—'}</h5>
                          <p className="text-sm text-gray-600">
                            {Number(item?.quantity ?? 0)} {item?.product?.unit ?? ''} × ₹{Number(item?.unitPrice ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹{Number((item?.quantity ?? 0) * (item?.unitPrice ?? 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {(selectedOrder?.deliveryAddress || selectedOrder?.addressSnapshot) && (
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Address
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedOrder?.deliveryAddress || (() => {
                      try {
                        const addr = JSON.parse(selectedOrder?.addressSnapshot || '{}');
                        return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}${addr.landmark ? ', Near ' + addr.landmark : ''}`;
                      } catch {
                        return selectedOrder?.addressSnapshot || 'N/A';
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
