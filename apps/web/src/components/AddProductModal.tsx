import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { X, Package, Plus } from 'lucide-react';
import Button from './ui/Button';
import ProductImageUpload from './ProductImageUpload';

const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  stockQty: z.number().int().min(0, 'Stock quantity cannot be negative'),
  minOrderQty: z.number().int().min(1, 'Minimum order quantity must be at least 1'),
  categoryId: z.string().min(1, 'Category is required'),
});

type AddProductFormData = z.infer<typeof addProductSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const queryClient = useQueryClient();
  const [productImages, setProductImages] = useState<string[]>([]);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      unit: 'kg',
      stockQty: 0,
      minOrderQty: 1,
      categoryId: '',
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    { enabled: isOpen }
  );

  // Add product mutation
  const addProductMutation = useMutation(
    (data: AddProductFormData & { images: string[] }) => 
      api.post('/products', data),
    {
      onSuccess: () => {
        toast.success('Product added successfully!');
        form.reset();
        setProductImages([]);
        queryClient.invalidateQueries('farmer-products');
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add product');
      }
    }
  );

  const onSubmit = (data: AddProductFormData) => {
    addProductMutation.mutate({
      ...data,
      images: productImages
    });
  };

  const handleImagesChange = (images: string[]) => {
    setProductImages(images);
  };

  const handleClose = () => {
    if (!addProductMutation.isLoading) {
      form.reset();
      setProductImages([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={addProductMutation.isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Product Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <ProductImageUpload
              onImagesChange={handleImagesChange}
              maxImages={5}
            />
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                {...form.register('name')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Organic Tomatoes"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...form.register('categoryId')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...form.register('description')}
              rows={3}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your product quality, farming methods, etc."
            />
          </div>

          {/* Pricing and Quantities */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...form.register('price', { valueAsNumber: true })}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                {...form.register('unit')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="piece">Piece</option>
                <option value="dozen">Dozen</option>
                <option value="bundle">Bundle</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
              </select>
              {form.formState.errors.unit && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...form.register('stockQty', { valueAsNumber: true })}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
              />
              {form.formState.errors.stockQty && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.stockQty.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Quantity *
              </label>
              <input
                type="number"
                {...form.register('minOrderQty', { valueAsNumber: true })}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="1"
              />
              {form.formState.errors.minOrderQty && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.minOrderQty.message}</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addProductMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={addProductMutation.isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
