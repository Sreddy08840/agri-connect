import api from './api';

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  imageUrl?: string | null;
  farmerName?: string | null;
  categoryId?: string;
};

export async function listProducts(params?: { page?: number; pageSize?: number; search?: string; categoryId?: string }) {
  const { page = 1, pageSize = 20, search, categoryId } = params || {};
  const { data } = await api.get('/products', { params: { page, pageSize, search, categoryId } });
  return (data?.products || []) as Product[];
}

export async function getProduct(id: string) {
  const { data } = await api.get(`/products/${id}`);
  return data as Product;
}

export async function searchProducts(query: string) {
  const { data } = await api.get('/products', { params: { search: query } });
  return (data?.products || []) as Product[];
}
