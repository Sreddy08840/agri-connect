import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import Button from './ui/Button';

const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stockQty: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  unit: z.string().min(1, 'Unit is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess?: () => void;
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess }: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stockQty: 0,
      unit: '',
      categoryId: '',
    }
  });

  // Fetch categories
  const { data: categoriesData } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    { enabled: isOpen }
  );
  const categories = categoriesData?.categories || [];

  // Update form when product changes
  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        stockQty: product.stockQty || 0,
        unit: product.unit || '',
        categoryId: product.categoryId || '',
      });
    }
  }, [product, isOpen, form]);

  const updateProductMutation = useMutation(
    (data: EditProductFormData) => api.patch(`/products/${product.id}`, data),
    {
      onSuccess: () => {
        toast.success('Product updated successfully');
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update product');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const onSubmit = (data: EditProductFormData) => {
    setIsSubmitting(true);
    updateProductMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                {...form.register('name')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter product name"
                disabled={isSubmitting}
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...form.register('price', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...form.register('stockQty', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
                disabled={isSubmitting}
              />
              {form.formState.errors.stockQty && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.stockQty.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                {...form.register('unit')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="">Select unit</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="ltr">Liter (ltr)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="dozen">Dozen</option>
                <option value="bunch">Bunch</option>
              </select>
              {form.formState.errors.unit && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...form.register('description')}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your product..."
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
