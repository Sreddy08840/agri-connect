import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../lib/api';
import { Package } from 'lucide-react';
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

const statuses = ['ACCEPTED','REJECTED','PACKED','SHIPPED','DELIVERED'] as const;

export default function FarmerOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ orders: Order[] }>(
    ['farmer-orders'],
    () => api.get('/orders').then(res => res.data)
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
            <div className="text-gray-500">Loading...</div>
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
                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize text-xs">
                          {o.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={rowStatus[o.id] || o.status}
                            className="border rounded-md px-2 py-1 text-sm capitalize"
                            onChange={(e) => setRowStatus((s) => ({ ...s, [o.id]: e.target.value as any }))}
                          >
                            {statuses.map(s => (
                              <option key={s} value={s}>{s.toLowerCase()}</option>
                            ))}
                          </select>
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: o.id, status: (rowStatus[o.id] || o.status) as any })}>Update</Button>
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
