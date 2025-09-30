import api from './api';

export type FarmerProductInput = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

export async function getMyProducts() {
  const { data } = await api.get('/farmer/products');
  return data as any[];
}

export async function addProduct(body: FarmerProductInput) {
  const { data } = await api.post('/farmer/products', body);
  return data;
}

export async function updateProduct(id: string, body: Partial<FarmerProductInput>) {
  const { data } = await api.put(`/farmer/products/${id}`, body);
  return data;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete(`/farmer/products/${id}`);
  return data;
}

export async function getFarmerOrders() {
  const { data } = await api.get('/farmer/orders');
  return data as any[];
}
