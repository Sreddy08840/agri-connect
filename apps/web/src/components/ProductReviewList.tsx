import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { StarRating } from './StarRating';
import { User, Calendar } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface ProductReviewListProps {
  productId: string;
}

export const ProductReviewList: React.FC<ProductReviewListProps> = ({ productId }) => {
  const { data, isLoading } = useQuery(
    ['reviews', productId],
    () => api.get(`/reviews/products/${productId}?limit=20`).then((res) => res.data),
    { enabled: !!productId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-6 h-32" />
        ))}
      </div>
    );
  }

  const reviews: Review[] = data?.reviews || [];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          {/* User Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {review.user.avatarUrl ? (
                <img
                  src={review.user.avatarUrl}
                  alt={review.user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-farmer-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-farmer-green-600" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{review.user.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}

      {/* Show total count */}
      {data?.total > reviews.length && (
        <p className="text-center text-sm text-gray-500 py-4">
          Showing {reviews.length} of {data.total} reviews
        </p>
      )}
    </div>
  );
};

export default ProductReviewList;
