import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getRecommendations, type RecommendationItem } from '../lib/api/ai';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecommendedProducts() {
  const { user } = useAuthStore();
  const token = localStorage.getItem('accessToken');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user) {
      loadRecommendations();
    }
  }, [token, user]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getRecommendations(token!, 8);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !user || loading) {
    return null;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-green-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Recommended for You
          </h2>
        </div>
        <p className="text-gray-600 mb-8">
          AI-powered product suggestions based on your preferences
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {Math.round(product.recommendationScore * 100)}%
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 truncate">
                  {product.category.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    ₹{product.price}/{product.unit}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success('Added to cart!');
                    }}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  by {product.farmer.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
