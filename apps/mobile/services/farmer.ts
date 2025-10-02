import api from './api';

export type FarmerProductInput = {
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQty: number;
  minOrderQty: number;
  categoryId: string;
  images?: string[];
};

export async function getMyProducts() {
  const { data } = await api.get('/products/my-products');
  return (data?.products || []) as any[];
}

export async function addProduct(body: FarmerProductInput) {
  const { data } = await api.post('/products', body);
  return data;
}

export async function updateProduct(id: string, body: Partial<FarmerProductInput>) {
  const { data } = await api.patch(`/products/${id}`, body);
  return data;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function getFarmerOrders() {
  const { data } = await api.get('/orders/farmer-orders');
  return (data?.orders || []) as any[];
}
