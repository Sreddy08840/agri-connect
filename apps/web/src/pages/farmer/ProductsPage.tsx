import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { getProductMainImage } from '../../lib/imageUtils';
import { Plus, Edit2, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ProductImageUpload from '../../components/ProductImageUpload';
import { startVoiceRecognition, speakResponse } from '../../utils/speech';
import VoiceWave from '../../components/ui/VoiceWave';

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
  const location = useLocation();
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [parsedProduct, setParsedProduct] = useState<any>(null);

  const handleVoiceInput = async () => {
    try {
      setRecognizedText('Listening...');
      const text = await startVoiceRecognition(
        () => setIsListening(true),
        () => setIsListening(false),
        (err) => toast.error(err)
      );
      if (text) {
        setRecognizedText(text);
        
        try {
          const response = await api.post('/ai/transcribe-product', { text });
          const parsedData = response.data;
          setParsedProduct(parsedData);
          
          // Auto-fill form
          if (parsedData.name && parsedData.name !== 'Unknown Product') {
            form.setValue('name', parsedData.name, { shouldValidate: true });
          }
          if (parsedData.stockQty > 0) {
            form.setValue('stockQty', parsedData.stockQty, { shouldValidate: true });
          }
          if (parsedData.unit) {
            form.setValue('unit', parsedData.unit, { shouldValidate: true });
          }
          if (parsedData.price > 0) {
            form.setValue('price', parsedData.price, { shouldValidate: true });
          }
          
          toast.success('Voice input processed! Form auto-filled.');
          speakResponse('Product details added. Please confirm and submit.');
        } catch (apiError) {
          console.error('Transcription error:', apiError);
          toast.error('Failed to parse product data');
        }
      } else {
        setRecognizedText('');
      }
    } catch (e) {
      setRecognizedText('');
    }
  };
  
  const scrollToForm = () => {
    document.getElementById('create-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'kg', stockQty: 0, minOrderQty: 1 },
  });

  // Auto-fill form from Voice AI navigation state
  useEffect(() => {
    const voiceData = (location.state as any)?.voiceData;
    if (voiceData) {
      if (voiceData.product) {
        form.setValue('name', voiceData.product, { shouldValidate: true });
      }
      if (voiceData.quantity !== null && !isNaN(voiceData.quantity)) {
        form.setValue('stockQty', voiceData.quantity, { shouldValidate: true });
      }
      if (voiceData.unit) {
        form.setValue('unit', voiceData.unit, { shouldValidate: true });
      }
      toast.success('Form auto-filled from voice command!');
      
      // Clean up state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, form]);

  const { data: categories } = useQuery(
    ['categories'],
    () => api.get('/categories').then(res => res.data)
  );

  const [newCategory, setNewCategory] = useState('');
  useMutation(
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingImages, setEditingImages] = useState<Record<string, string[]>>({});

  const startEdit = (p: any) => {
    setEditingProduct(p);
    setEditingImages({ [p.id]: p.images || [] });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setEditingImages({});
  };

  const saveEditModal = () => {
    if (!editingProduct) return;
    const images = editingImages[editingProduct.id] || [];
    const patch = {
      price: editingProduct.price,
      stockQty: editingProduct.stockQty,
      images: images.length > 0 ? images : null,
    };
    updateMutation.mutate({ id: editingProduct.id, patch }, {
      onSuccess: () => {
        closeEditModal();
      }
    });
  };

  const updateEditingProduct = (field: string, value: any) => {
    if (!editingProduct) return;
    setEditingProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditImagesChange = (images: string[]) => {
    if (!editingProduct) return;
    setEditingImages((prev: Record<string, string[]>) => ({ ...prev, [editingProduct.id]: images }));
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
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
            <Plus className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {recognizedText && (
              <div className="text-sm bg-gray-100 px-3 py-2 rounded-md italic text-gray-700 flex-1 sm:flex-none">
                "{recognizedText}"
              </div>
            )}
            {parsedProduct && (
              <div className="text-sm bg-green-50 px-3 py-2 rounded-md text-green-700 flex-1 sm:flex-none">
                <span className="font-semibold">Parsed:</span> {parsedProduct.name} - {parsedProduct.stockQty} {parsedProduct.unit} @ ₹{parsedProduct.price}
              </div>
            )}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 shadow-sm ${
                isListening 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
              }`}
            >
              {isListening ? (
                <>
                  <VoiceWave isListening={isListening} />
                  <span className="ml-1">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  <span>Voice Input</span>
                </>
              )}
            </button>
          </div>
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
                      <td className="py-2 pr-4">₹{p.price}</td>
                      <td className="py-2 pr-4">{p.stockQty}</td>
                      <td className="py-2 pr-4 capitalize">{p.status?.toLowerCase?.() || 'draft'}</td>
                      <td className="py-2 pr-4">
                        <Button variant="outline" onClick={() => startEdit(p)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Edit
                        </Button>
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

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Edit Product</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                  <ProductImageUpload
                    onImagesChange={handleEditImagesChange}
                    maxImages={5}
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload up to 5 high-quality images of your product</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => updateEditingProduct('price', Number(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={editingProduct.stockQty}
                      onChange={(e) => updateEditingProduct('stockQty', Number(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button onClick={saveEditModal} disabled={updateMutation.isLoading}>
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
