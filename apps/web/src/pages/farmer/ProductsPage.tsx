import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../lib/api';
import { getProductMainImage } from '../../lib/imageUtils';
import { Plus, Save, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ProductImageUpload from '../../components/ProductImageUpload';

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  unit: z.string().min(1),
  stockQty: z.coerce.number().int().min(0),
  minOrderQty: z.coerce.number().int().min(1),
  categoryId: z.string().min(1),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function FarmerProductsPage() {
  const queryClient = useQueryClient();
  const [productImages, setProductImages] = useState<string[]>([]);
  
  const scrollToForm = () => {
    document.getElementById('create-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'kg', stockQty: 0, minOrderQty: 1 },
  });

  const { data: categories } = useQuery(
    ['categories'],
    () => api.get('/categories').then(res => res.data)
  );

  const [newCategory, setNewCategory] = useState('');
  const quickCreateCategory = useMutation(
    () => api.post('/categories/quick-create', { name: newCategory }),
    {
      onSuccess: () => {
        toast.success('Category created');
        setNewCategory('');
        queryClient.invalidateQueries(['categories']);
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to create category'); }
    }
  );

  const { data: myProducts, isLoading } = useQuery(
    ['farmer-products'],
    () => api.get('/products/mine/list').then(res => res.data)
  );

  const createMutation = useMutation(
    (data: any) => api.post('/products', data),
    {
      onSuccess: () => {
        toast.success('Product submitted for review');
        queryClient.invalidateQueries(['farmer-products']);
        form.reset({ unit: 'kg', stockQty: 0, minOrderQty: 1 });
        setProductImages([]);
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to create product'); }
    }
  );

  const updateMutation = useMutation(
    ({ id, patch }: { id: string; patch: any }) => api.patch(`/products/${id}`, patch),
    {
      onSuccess: () => {
        toast.success('Product updated');
        queryClient.invalidateQueries(['farmer-products']);
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to update product'); }
    }
  );

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      unit: data.unit,
      stockQty: data.stockQty,
      minOrderQty: data.minOrderQty,
      categoryId: data.categoryId,
      images: productImages,
    };
    createMutation.mutate(payload);
  };
  
  const handleImagesChange = (images: string[]) => {
    setProductImages(images);
  };

  const [editing, setEditing] = useState<Record<string, { price: number; stockQty: number }>>({});

  const startEdit = (p: any) => setEditing(prev => ({ ...prev, [p.id]: { price: p.price, stockQty: p.stockQty } }));
  const changeEdit = (id: string, field: 'price'|'stockQty', value: number) => setEditing(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  const saveEdit = (id: string) => {
    const patch = editing[id];
    if (!patch) return;
    updateMutation.mutate({ id, patch });
    setEditing(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
        <Button onClick={scrollToForm}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Upload / Create Product */}
      <div className="bg-white rounded-lg shadow" id="create-product-form">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
          <Plus className="h-5 w-5 text-green-600" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...form.register('name')} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Tomatoes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select {...form.register('categoryId')} className="mt-1 w-full border rounded-md px-3 py-2">
              <option value="">Select agricultural category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {form.formState.errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">Please select a category</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...form.register('description')} className="mt-1 w-full border rounded-md px-3 py-2" rows={3} placeholder="Fresh farm tomatoes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" step="0.01" {...form.register('price')} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <input {...form.register('unit')} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="kg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Qty</label>
            <input type="number" {...form.register('stockQty', { valueAsNumber: true })} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Order Qty</label>
            <input type="number" {...form.register('minOrderQty', { valueAsNumber: true })} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <ProductImageUpload
              onImagesChange={handleImagesChange}
              maxImages={5}
            />
            <p className="text-sm text-gray-500 mt-1">Upload up to 5 high-quality images of your product</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={createMutation.isLoading}>
              <Plus className="h-4 w-4 mr-2" /> {createMutation.isLoading ? 'Submitting...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : myProducts?.products?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4">Price</th>
                    <th className="pb-2 pr-4">Stock</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myProducts.products.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                            <img 
                              src={getProductMainImage(p as any)} 
                              alt={p.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.svg';
                              }}
                            />
                          </div>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        {editing[p.id] ? (
                          <input type="number" step="0.01" value={editing[p.id].price} onChange={(e) => changeEdit(p.id, 'price', Number(e.target.value))} className="w-24 border rounded px-2 py-1" />
                        ) : (
                          <>₹{p.price}</>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {editing[p.id] ? (
                          <input type="number" value={editing[p.id].stockQty} onChange={(e) => changeEdit(p.id, 'stockQty', Number(e.target.value))} className="w-24 border rounded px-2 py-1" />
                        ) : (
                          <>{p.stockQty}</>
                        )}
                      </td>
                      <td className="py-2 pr-4 capitalize">{p.status?.toLowerCase?.() || 'draft'}</td>
                      <td className="py-2 pr-4">
                        {editing[p.id] ? (
                          <Button onClick={() => saveEdit(p.id)}>
                            <Save className="h-4 w-4 mr-2" /> Save
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => startEdit(p)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No products added yet</p>
              <Button onClick={scrollToForm}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Product
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
