import api from './api';

export async function getCatalog() {
  const { data } = await api.get('/products');
  // backend returns { products, pagination }
  return (data?.products || []) as any[];
}

export async function getProduct(id: string) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function getOrders() {
  const { data } = await api.get('/orders');
  // backend returns { orders, pagination }
  return (data?.orders || []) as any[];
}

export async function checkout(cart: { productId: string; qty: number }[]) {
  // backend expects POST /orders with { items, paymentMethod, address }
  const payload = {
    items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
    paymentMethod: 'COD' as const,
    address: { street: 'N/A', city: 'N/A', state: 'N/A', pincode: '000000' },
  };
  const { data } = await api.post('/orders', payload);
  return data;
}
