import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import { getProductMainImage } from '../lib/imageUtils';
import { ShoppingCart, Truck, MessageCircle, Star as StarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import RatingDialog from '../components/ui/RatingDialog';
import { trackProductView, trackAddToCart } from '../utils/events';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { StarRating } from '../components/StarRating';
import { ProductReviewList } from '../components/ProductReviewList';
import { ProductReviewForm } from '../components/ProductReviewForm';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: product, isLoading } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  // Check if user can review this product
  const { data: reviewEligibility } = useQuery(
    ['can-review', id],
    () => api.get(`/reviews/products/${id}/can-review`).then(res => res.data),
    { enabled: !!id && !!user && user.role === 'CUSTOMER' }
  );

  // Get user's existing review
  const { data: myReviewData } = useQuery(
    ['my-review', id],
    () => api.get(`/reviews/products/${id}/my-review`).then(res => res.data),
    { enabled: !!id && !!user && user.role === 'CUSTOMER' }
  );

  // Track product view when product loads
  useEffect(() => {
    if (product?.id) {
      trackProductView(product.id, user?.id);
    }
  }, [product?.id, user?.id]);

  const addToCartMutation = useMutation(
    (qty: number) => api.post('/cart/items', { productId: id, qty }),
    {
      onSuccess: (_, qty) => {
        queryClient.invalidateQueries('cart');
        toast.success('Added to cart!');
        // Track add to cart event
        if (product) {
          trackAddToCart(
            product.id,
            user?.id,
            product.price * qty,
            { quantity: qty, unit: product.unit }
          );
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add to cart');
      },
    }
  );

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if product is in stock
    if (product.stockQty <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    addToCartMutation.mutate(1);
  };

  const handleMessageSeller = async () => {
    if (!user) {
      toast.error('Please login to message the seller');
      navigate('/login');
      return;
    }

    if (user.role === 'FARMER') {
      toast.error('Farmers cannot message other farmers');
      return;
    }

    if (!product) return;

    try {
      setIsStartingChat(true);
      const response = await api.post('/chat/start', {
        farmerId: product.farmer.id,
        productId: product.id,
        initialMessage: `Hi! I'm interested in your product: ${product.name}`,
      });

      const chatId = response.data.chat.id;
      navigate(`/chat/${chatId}`);
      toast.success('Chat started!');
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast.error(error.response?.data?.error || 'Failed to start chat');
    } finally {
      setIsStartingChat(false);
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

          {/* Product Rating */}
          <div className="flex items-center space-x-4">
            <StarRating rating={product.ratingAvg || 0} size="md" showValue />
            {product.ratingCount > 0 && (
              <span className="text-sm text-gray-600">({product.ratingCount} reviews)</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-farmer-beige-50 to-farmer-beige-100 p-6 rounded-2xl border border-farmer-beige-200">
            <h3 className="font-semibold text-gray-900 mb-2">Farmer Details</h3>
            <p className="text-gray-600 mb-4">
              {product.farmer.farmerProfile?.businessName || product.farmer.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMessageSeller}
                disabled={isStartingChat || user?.role === 'FARMER'}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{isStartingChat ? 'Starting...' : 'Message Seller'}</span>
              </button>
              <RatingDialog
                farmerId={(product as any)?.farmer?.id}
                farmerName={product.farmer.farmerProfile?.businessName || product.farmer.name}
                triggerClassName="px-4 py-2.5 border-2 border-farmer-green-600 text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl font-medium transition-all duration-200"
                triggerLabel="Rate"
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
            <div className="text-sm">
              {product.stockQty > 0 ? (
                <span className="text-green-600 font-medium">✓ In Stock ({product.stockQty} available)</span>
              ) : (
                <span className="text-red-600 font-medium">✗ Out of Stock</span>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Min order: {product.minOrderQty} {product.unit}
          </div>

          <div className="flex space-x-4">
        <button
          className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-all duration-200 ${
            product.stockQty <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 shadow-md hover:shadow-lg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleAddToCart}
          disabled={addToCartMutation.isLoading || product.stockQty <= 0}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {product.stockQty <= 0 ? 'Out of Stock' : addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
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

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {user?.role === 'CUSTOMER' && reviewEligibility?.canReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <StarIcon className="h-4 w-4" />
              <span>Write a Review</span>
            </button>
          )}
          {user?.role === 'CUSTOMER' && myReviewData?.review && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-farmer-green-600 text-farmer-green-600 rounded-xl hover:bg-farmer-green-50 font-medium transition-all duration-200"
            >
              <StarIcon className="h-4 w-4" />
              <span>Edit Your Review</span>
            </button>
          )}
        </div>

        {/* Review eligibility message */}
        {user?.role === 'CUSTOMER' && reviewEligibility && !reviewEligibility.canReview && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              {!reviewEligibility.hasPurchased
                ? 'Purchase this product to leave a review'
                : reviewEligibility.hasReviewed
                ? 'You have already reviewed this product'
                : 'You can review this product after it has been delivered'}
            </p>
          </div>
        )}

        <ProductReviewList productId={id!} />
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ProductReviewForm
          productId={id!}
          productName={product.name}
          existingReview={myReviewData?.review}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}
