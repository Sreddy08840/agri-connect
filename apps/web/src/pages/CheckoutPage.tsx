import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { CreditCard, Truck } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { trackPurchase } from '../utils/events';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const createOrder = useMutation(
    async () => {
      // Check if user is authenticated
      if (!user) {
        throw new Error('Please log in to place an order');
      }

      if (!items || items.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Validate items have required fields
      const invalidItems = items.filter(item => 
        !item.productId || !item.qty || item.qty <= 0
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Some items in your cart are invalid');
      }

      // Validate address fields
      if (!address.street || !address.city || !address.state || !address.pincode) {
        throw new Error('Please fill in all required address fields');
      }

      const payload = {
        items: items.map(i => ({ 
          productId: i.productId, 
          qty: Number(i.qty) 
        })),
        paymentMethod: 'COD' as const,
        address: {
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
          landmark: address.landmark.trim() || undefined,
        },
      };

      const order = await api.post('/orders', payload).then(r => r.data);
      
      // Persist address to user profile for future prefill
      try {
        await api.patch('/users/me', { address: JSON.stringify(payload.address) });
      } catch {
        // non-blocking
      }
      return order;
    },
    {
      onSuccess: (order) => {
        toast.success('Order placed successfully!');
        
        // Track purchase event
        trackPurchase(
          user?.id,
          total,
          {
            orderId: order.id,
            itemCount: items.length,
            paymentMethod: 'COD',
            items: items.map(i => ({
              productId: i.productId,
              name: i.name,
              quantity: i.qty,
              price: i.price
            }))
          }
        );
        
        clearCart();
        navigate(`/order-confirmation/${order.id}`);
      },
      onError: (e: any) => {
        console.error('Order creation error:', e);
        
        // More specific error handling
        let errorMessage = 'Failed to place order';
        
        if (e?.response?.data?.error) {
          errorMessage = e.response.data.error;
        } else if (e?.response?.status === 401) {
          errorMessage = 'Please log in to place an order';
        } else if (e?.response?.status === 400) {
          errorMessage = 'Invalid order data. Please check your cart and address.';
        } else if (e?.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (e?.message) {
          errorMessage = e.message;
        }
        
        toast.error(errorMessage);
      },
    }
  );

  const total = getTotalPrice();

  // Add early return if cart is empty
  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <Truck className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="mb-6">Add some products to proceed with checkout.</p>
            <button 
              className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prefill address from user profile
  useEffect(() => {
    try {
      const a = (user as any)?.address;
      const parsed = typeof a === 'string' ? JSON.parse(a) : a;
      if (parsed && parsed.street && parsed.city && parsed.state && parsed.pincode) {
        setAddress({
          street: parsed.street || '',
          city: parsed.city || '',
          state: parsed.state || '',
          pincode: parsed.pincode || '',
          landmark: parsed.landmark || '',
        });
      }
    } catch {}
  }, [user]);

  // Group items by farmer for preview
  const groups = useMemo(() => {
    const map = new Map<string, { farmerName: string; items: typeof items }>();
    (items || []).forEach(it => {
      const key = it.farmerId;
      const entry = map.get(key);
      if (!entry) {
        map.set(key, { farmerName: it.farmerName, items: [it] } as any);
      } else {
        (entry.items as any).push(it);
      }
    });
    return Array.from(map.entries()).map(([farmerId, v]) => ({ farmerId, ...v }));
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info:</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>User authenticated: {user ? '✅ Yes' : '❌ No'}</p>
            <p>Cart items: {items?.length || 0}</p>
            <p>Total: ₹{getTotalPrice().toFixed(2)}</p>
            <p>Address filled: {address.street && address.city && address.state && address.pincode ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Street and house</label>
            <input value={address.street} onChange={(e)=>setAddress(a=>({...a, street:e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="12, MG Road" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">City</label>
            <input value={address.city} onChange={(e)=>setAddress(a=>({...a, city:e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="Hyderabad" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">State</label>
            <input value={address.state} onChange={(e)=>setAddress(a=>({...a, state:e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="Telangana" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Pincode</label>
            <input value={address.pincode} onChange={(e)=>setAddress(a=>({...a, pincode:e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="500001" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Landmark (optional)</label>
            <input value={address.landmark} onChange={(e)=>setAddress(a=>({...a, landmark:e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="Near market" />
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500">Note: Orders may be split by farmer. Currently one order per farmer is created on the server.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        {/* Farmer groups */}
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.farmerId} className="border rounded p-3">
              <div className="text-sm font-semibold text-gray-800">{g.farmerName}</div>
              <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
                {g.items.map((it) => (
                  <li key={it.productId}>{it.name} × {it.qty}</li>
                ))}
              </ul>
            </div>
          ))}
          {groups.length > 1 && (
            <p className="text-xs text-gray-500">Note: Your cart has items from multiple farmers. Orders may be created per-farmer.</p>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Items</span>
          <span>{items.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Total</span>
          <span className="text-xl font-bold text-green-700">₹{total.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <button
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50"
            type="button"
            disabled
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Online (Coming Soon)
          </button>
          <button
            className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="button"
            onClick={() => createOrder.mutate()}
            disabled={
              createOrder.isLoading || 
              !address.street || 
              !address.city || 
              !address.state || 
              !address.pincode ||
              !user ||
              !items ||
              items.length === 0
            }
          >
            {createOrder.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Placing Order...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Place COD Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
