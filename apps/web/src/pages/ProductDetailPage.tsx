import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import { getProductMainImage } from '../lib/imageUtils';
// Button component removed - using HTML buttons
import { ShoppingCart, Star, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import RatingDialog from '../components/ui/RatingDialog';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  const addToCartMutation = useMutation(
    (qty: number) => api.post('/cart/items', { productId: id, qty }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
        toast.success('Added to cart!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add to cart');
      },
    }
  );

  const handleAddToCart = () => {
    if (product) {
      addToCartMutation.mutate(1);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            <img 
              src={getProductMainImage(product)} 
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.svg';
              }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{product.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${
                    i < Math.floor(product.farmer.farmerProfile?.ratingAvg || 0) 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {product.farmer.farmerProfile?.ratingAvg || 0} rating
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900">Farmer Details</h3>
            <p className="text-gray-600">
              {product.farmer.farmerProfile?.businessName || product.farmer.name}
            </p>
            <div className="mt-3">
              <RatingDialog
                farmerId={(product as any)?.farmer?.id}
                farmerName={product.farmer.farmerProfile?.businessName || product.farmer.name}
                triggerClassName="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                triggerLabel="Rate Farmer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-green-600">
                ₹{product.price}
              </span>
              <span className="text-gray-600 ml-2">per {product.unit}</span>
            </div>
            <div className="text-sm text-gray-600">
              Min order: {product.minOrderQty} {product.unit}
            </div>
          </div>

          <div className="flex space-x-4">
        <button
          className="flex-1 px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToCart}
          disabled={addToCartMutation.isLoading}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
        </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold flex items-center justify-center">
              <Truck className="h-5 w-5 mr-2" />
              Buy Now
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Delivery Info</h3>
            <p className="text-sm text-green-700">
              Direct delivery from farm to your doorstep. 
              Estimated delivery: 1-2 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
