import api from './api';

export type CartItem = {
  id: string;
  productId: string;
  qty: number;
  unitPriceSnapshot: number;
  product?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export async function getCart(): Promise<Cart> {
  const { data } = await api.get('/cart');
  return data as Cart;
}

export async function addToCart(productId: string, qty = 1): Promise<CartItem> {
  const { data } = await api.post('/cart/items', { productId, qty });
  return data as CartItem;
}

export async function updateCartItem(id: string, qty: number): Promise<CartItem> {
  const { data } = await api.patch(`/cart/items/${id}`, { qty });
  return data as CartItem;
}

export async function removeCartItem(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/cart/items/${id}`);
  return data as { success: boolean };
}

export async function clearCart(): Promise<{ success: boolean }> {
  const { data } = await api.delete('/cart');
  return data as { success: boolean };
}

// Simple checkout via Orders API
export async function checkout(items: { productId: string; qty: number }[], options?: {
  paymentMethod?: 'ONLINE' | 'COD';
  address?: { street: string; city: string; state: string; pincode: string; landmark?: string };
}) {
  const payload = {
    items,
    paymentMethod: options?.paymentMethod || 'COD',
    address: options?.address || { street: 'N/A', city: 'N/A', state: 'N/A', pincode: '000000' },
  };
  const { data } = await api.post('/orders', payload);
  return data;
}
