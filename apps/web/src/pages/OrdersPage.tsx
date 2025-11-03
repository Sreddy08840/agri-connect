import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Package, Clock, CheckCircle, Truck, Eye, Shield, Star } from 'lucide-react';
import { ProductReviewForm } from '../components/ProductReviewForm';
import toast from 'react-hot-toast';

type OrderItem = {
  qty: number;
  productId: string;
  product: {
    id: string;
    name: string;
    images?: string[];
  };
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  farmer: {
    businessName?: string | null;
    user?: { name?: string | null } | null;
  };
  reviewed?: boolean;
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'confirmed':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    case 'shipped':
      return <Truck className="h-5 w-5 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Package className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewingProduct, setReviewingProduct] = useState<{ id: string; name: string } | null>(null);

  const { data: response, isLoading, error } = useQuery<{ orders: Order[] }>(
    'orders',
    () => api.get('/orders').then(res => res.data),
    {
      retry: 1,
      onError: (error: any) => {
        console.error('Failed to fetch orders:', error);
      }
    }
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-500 mb-6">Unable to load orders. Please check your connection and try again.</p>
          <button 
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const orders = response?.orders || [];

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Your orders will appear here once you make a purchase.</p>
          <button 
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold"
            onClick={() => navigate('/products')}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(-8)}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  From {order.farmer.businessName || order.farmer.user?.name || 'Farmer'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ₹{order.total.toFixed(2)}
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm font-medium flex items-center space-x-1"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  {order.status.toLowerCase() === 'delivered' && !order.reviewed && (
                    <button
                      className="px-3 py-1 bg-farmer-green-600 text-white hover:bg-farmer-green-700 rounded text-sm font-medium flex items-center space-x-1 transition-colors"
                      onClick={() => {
                        if (order.items.length > 0 && order.items[0].product?.id) {
                          setReviewingProduct({
                            id: order.items[0].product.id,
                            name: order.items[0].product.name
                          });
                        } else {
                          toast.error('Unable to review: Product information is missing. Please refresh the page.');
                        }
                      }}
                    >
                      <Star className="h-4 w-4" />
                      <span>Review</span>
                    </button>
                  )}
                  <button
                    className="px-3 py-1 bg-farmer-yellow-500 text-white hover:bg-farmer-yellow-600 rounded text-sm font-medium flex items-center space-x-1 transition-colors"
                    onClick={() => navigate(`/warranty/claim/${order.id}`)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>File Claim</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-gray-50 rounded px-3 py-2 group relative">
                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                      {item.product.images?.[0] ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="h-full w-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {item.product.name} x{item.qty}
                    </span>
                    {order.status.toLowerCase() === 'delivered' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.product?.id) {
                            setReviewingProduct({
                              id: item.product.id,
                              name: item.product.name
                            });
                          } else {
                            toast.error('Unable to review: Product information is missing. Please refresh the page.');
                          }
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Review this product"
                      >
                        <Star className="h-4 w-4 text-farmer-yellow-500 hover:text-farmer-yellow-600" />
                      </button>
                    )}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Form Modal */}
      {reviewingProduct && (
        <ProductReviewForm
          productId={reviewingProduct.id}
          productName={reviewingProduct.name}
          onClose={() => setReviewingProduct(null)}
          onSuccess={() => {
            // Refresh orders to update the reviewed status
            queryClient.invalidateQueries('orders');
          }}
        />
      )}
    </div>
  );
}
