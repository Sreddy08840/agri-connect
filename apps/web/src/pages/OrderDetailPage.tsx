import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import socketService from '../lib/socket';
import { ArrowLeft, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import RatingDialog from '../components/ui/RatingDialog';

interface OrderItem {
  id: string;
  qty: number;
  unitPriceSnapshot: number;
  product: { id: string; name: string; images?: string[] };
}

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  farmer: { id?: string; name: string; farmerProfile?: { businessName: string } };
  shippingAddress?: any;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'confirmed':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'shipped':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Package className="h-4 w-4 text-gray-500" />;
  }
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useQuery<OrderDetail>(
    ['order', id],
    () => api.get(`/orders/${id}`).then(res => res.data),
    { enabled: Boolean(id), retry: 1 }
  );

  // Live order state (updated via Socket.IO)
  const [currentOrder, setCurrentOrder] = useState<OrderDetail | undefined>(undefined);

  // When initial data arrives, seed live state
  useEffect(() => {
    if (order) setCurrentOrder(order);
  }, [order]);

  // Socket.IO: join order room and subscribe to updates
  useEffect(() => {
    if (!id) return;
    const sock = socketService.connect();
    socketService.joinOrderRoom(id);

    const onUpdate = (payload: any) => {
      // Be defensive about shape
      if (payload && payload.id === id) {
        setCurrentOrder((prev) => ({ ...(prev || {} as any), ...payload }));
      }
    };
    socketService.onOrderUpdate(onUpdate);

    return () => {
      socketService.leaveOrderRoom(id);
      // optional: no global disconnect to avoid breaking other listeners
      if (sock) {
        // remove specific listener to prevent leaks
        (sock as any).off?.('order-update', onUpdate);
      }
    };
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <button
          className="mr-4 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium flex items-center"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Order #{id?.slice(-8)}</h1>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-6 w-1/3 rounded" />
            <div className="bg-gray-200 h-32 rounded" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load order</h2>
          <p className="text-gray-500">Please try again later.</p>
        </div>
      )}

      {(currentOrder || order) && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2">
              {getStatusIcon((currentOrder || order)!.status)}
              <span className="capitalize text-sm text-gray-700">{(currentOrder || order)!.status}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ordered on {new Date((currentOrder || order)!.createdAt).toLocaleString()} from {(currentOrder || order)!.farmer.farmerProfile?.businessName || (currentOrder || order)!.farmer.name}
            </p>
            <p className="mt-2 text-lg font-bold text-gray-900">Total: ₹{(currentOrder || order)!.totalAmount.toFixed(2)}</p>

            {/* Rate Farmer for delivered orders */}
            {(currentOrder || order)!.status.toLowerCase() === 'delivered' && (
              <div className="mt-4">
                <RatingDialog
                  farmerId={(currentOrder || order)!.farmer.id}
                  farmerName={(currentOrder || order)!.farmer.farmerProfile?.businessName || (currentOrder || order)!.farmer.name}
                  triggerClassName="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                  triggerLabel="Rate Farmer"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {(currentOrder || order)!.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                      {it.product.images?.[0] ? (
                        <img src={it.product.images[0]} alt={it.product.name} className="h-full w-full object-cover rounded" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{it.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {it.qty}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">₹{(it.unitPriceSnapshot * it.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
