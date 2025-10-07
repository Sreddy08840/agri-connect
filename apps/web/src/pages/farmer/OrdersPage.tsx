
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../lib/api';
import { Package, CheckCircle, XCircle, Clock, Truck, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { qty: number; product: { name: string; images?: string[] } }[];
  customer: { name: string; phone: string };
};

const statuses = ['CONFIRMED', 'ACCEPTED', 'REJECTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'PACKED':
      return 'bg-purple-100 text-purple-800';
    case 'SHIPPED':
      return 'bg-indigo-100 text-indigo-800';
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return <Clock className="h-3 w-3" />;
    case 'ACCEPTED':
      return <CheckCircle className="h-3 w-3" />;
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="h-3 w-3" />;
    case 'PACKED':
      return <Box className="h-3 w-3" />;
    case 'SHIPPED':
    case 'DELIVERED':
      return <Truck className="h-3 w-3" />;
    default:
      return <Package className="h-3 w-3" />;
  }
};

export default function FarmerOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<{ orders: Order[] }>(
    ['farmer-orders'],
    () => api.get('/orders').then(res => res.data),
    {
      retry: 2,
      onError: (err: any) => {
        console.error('Failed to fetch orders:', err);
        toast.error(err.response?.data?.error || 'Failed to load orders');
      }
    }
  );

  // local status per order id
  const [rowStatus, setRowStatus] = useState<Record<string, Order['status']>>({});
  useEffect(() => {
    if (data?.orders) {
      const initial: Record<string, Order['status']> = {};
      for (const o of data.orders) initial[o.id] = o.status as Order['status'];
      setRowStatus(initial);
    }
  }, [data?.orders]);

  const updateStatus = useMutation(
    ({ id, status }: { id: string; status: typeof statuses[number] }) => api.patch(`/orders/${id}/status`, { status }),
    {
      onSuccess: () => {
        toast.success('Status updated');
        qc.invalidateQueries(['farmer-orders']);
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to update'); }
    }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Orders</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Order Management</h2>
          <span className="text-sm text-gray-500">{data?.orders?.length || 0} orders</span>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
              <span className="text-gray-500">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <p>Failed to load orders. Please try again.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Retry
              </button>
            </div>
          ) : (data?.orders ? (data.orders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-2 pr-4">Order</th>
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Items</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map(o => (
                    <tr key={o.id} className="border-t align-top">
                      <td className="py-2 pr-4">
                        <div className="text-gray-900 font-medium">#{o.id.slice(-6)}</div>
                        <div className="text-gray-500 text-xs">{new Date(o.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="text-gray-900">{o.customer?.name || 'Customer'}</div>
                        <div className="text-gray-500 text-xs">{o.customer?.phone}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <ul className="list-disc list-inside text-gray-700">
                          {o.items.map((it, idx) => (
                            <li key={idx}>{it.qty} x {it.product.name}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-2 pr-4 font-semibold text-gray-900">₹{o.total}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded capitalize text-xs font-medium ${getStatusColor(o.status)}`}>
                          {getStatusIcon(o.status)}
                          {o.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {/* Quick Actions for CONFIRMED orders */}
                          {o.status === 'CONFIRMED' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                onClick={() => updateStatus.mutate({ id: o.id, status: 'ACCEPTED' })}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => updateStatus.mutate({ id: o.id, status: 'REJECTED' })}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {/* Quick Actions for ACCEPTED orders */}
                          {o.status === 'ACCEPTED' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus.mutate({ id: o.id, status: 'PACKED' })}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
                            >
                              Mark as Packed
                            </Button>
                          )}
                          {/* Quick Actions for PACKED orders */}
                          {o.status === 'PACKED' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus.mutate({ id: o.id, status: 'SHIPPED' })}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1"
                            >
                              Mark as Shipped
                            </Button>
                          )}
                          {/* Quick Actions for SHIPPED orders */}
                          {o.status === 'SHIPPED' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus.mutate({ id: o.id, status: 'DELIVERED' })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1"
                            >
                              Mark as Delivered
                            </Button>
                          )}
                          {/* Manual status change dropdown */}
                          <div className="flex items-center gap-1">
                            <select
                              value={rowStatus[o.id] || o.status}
                              className="border rounded-md px-2 py-1 text-xs capitalize"
                              onChange={(e) => setRowStatus((s) => ({ ...s, [o.id]: e.target.value as any }))}
                            >
                              {statuses.map(s => (
                                <option key={s} value={s}>{s.toLowerCase()}</option>
                              ))}
                            </select>
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus.mutate({ id: o.id, status: (rowStatus[o.id] || o.status) as any })}
                              className="text-xs px-2 py-1"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders received yet</p>
            </div>
          )) : (
            <div className="text-center text-gray-500">Failed to load orders.</div>
          ))}
        </div>
      </div>
    </div>
  );
}
