import { useState } from 'react';
import { useMutation } from 'react-query';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface RatingDialogProps {
  farmerId?: string;
  farmerName: string;
  triggerClassName?: string;
  triggerLabel?: string;
}

export default function RatingDialog({ farmerId, farmerName, triggerClassName, triggerLabel = 'Rate Farmer' }: RatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const mutation = useMutation(
    () => api.post('/ratings', { farmerId, rating, comment }),
    {
      onSuccess: () => {
        toast.success('Thank you for your rating!');
        setOpen(false);
        setRating(5);
        setComment('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit rating');
      }
    }
  );

  return (
    <div>
      <button
        className={triggerClassName || 'px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold'}
        onClick={() => setOpen(true)}
        disabled={!farmerId}
        title={!farmerId ? 'Cannot rate: missing farmer id' : undefined}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Rate {farmerName}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`h-10 w-10 rounded-full border flex items-center justify-center ${n <= rating ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-gray-600 border-gray-300'}`}
                    onClick={() => setRating(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                onClick={() => mutation.mutate()}
                disabled={mutation.isLoading || !farmerId}
              >
                {mutation.isLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
