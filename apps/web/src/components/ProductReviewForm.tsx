import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import { StarRating } from './StarRating';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductReviewFormProps {
  productId: string;
  productName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductReviewForm({
  productId,
  productName,
  existingReview,
  onClose,
  onSuccess,
}: ProductReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation(
    () => {
      if (!productId) {
        throw new Error('Product ID is missing');
      }
      return api.post(`/reviews/products/${productId}`, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    {
      onSuccess: () => {
        toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
        queryClient.invalidateQueries(['product', productId]);
        queryClient.invalidateQueries(['reviews', productId]);
        queryClient.invalidateQueries(['my-review', productId]);
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit review');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Unable to submit review: Product information is missing');
      onClose();
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReviewMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {existingReview ? 'Update Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <p className="text-sm text-gray-600">Reviewing:</p>
            <p className="font-semibold text-gray-900">{productName}</p>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitReviewMutation.isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl font-medium hover:from-farmer-green-700 hover:to-farmer-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitReviewMutation.isLoading
                ? 'Submitting...'
                : existingReview
                ? 'Update Review'
                : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductReviewForm;
