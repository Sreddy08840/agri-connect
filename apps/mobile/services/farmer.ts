import api from './api';

export type FarmerProductInput = {
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQty: number;
  minOrderQty: number;
  categoryId?: string;
  images?: string[];
};

export async function getMyProducts() {
  console.log('📦 Fetching farmer products...');
  const { data } = await api.get('/products/my-products');
  console.log('📦 Raw API response:', data);
  const products = (data?.products || []) as any[];
  console.log('📦 Processed products:', products.length, 'items');
  console.log('📦 First product sample:', products[0]);
  return products;
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
  if (!id || id === 'undefined') {
    throw new Error('Invalid product ID provided for deletion');
  }
  console.log('🗑️ Deleting product with API call to:', `/products/${id}`);
  const { data } = await api.delete(`/products/${id}`);
  console.log('🗑️ Delete response:', data);
  return data;
}

export async function getFarmerOrders() {
  const { data } = await api.get('/orders/farmer-orders');
  return (data?.orders || []) as any[];
}
