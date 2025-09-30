import api from './api';

export async function getCatalog() {
  const { data } = await api.get('/products');
  return data as any[];
}

export async function getProduct(id: string) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function getOrders() {
  const { data } = await api.get('/orders');
  return data as any[];
}

export async function checkout(cart: { productId: string; qty: number }[]) {
  const { data } = await api.post('/checkout', { items: cart });
  return data;
}
