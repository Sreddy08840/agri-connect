import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { api } from '../lib/api';
import { Camera, Upload, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WarrantyClaimPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [issueDescription, setIssueDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: order, isLoading: orderLoading } = useQuery(
    ['order', orderId],
    () => api.get(`/orders/${orderId}`).then(res => res.data),
    { enabled: !!orderId }
  );

  const { data: existingClaims } = useQuery(
    ['warranty-claims', orderId],
    () => api.get(`/warranty/order/${orderId}`).then(res => res.data),
    { enabled: !!orderId }
  );

  const createClaimMutation = useMutation(
    (data: { orderId: string; issueDescription: string; photos?: string[] }) =>
      api.post('/warranty/claim', data),
    {
      onSuccess: () => {
        toast.success('Warranty claim submitted successfully!');
        navigate('/orders');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit warranty claim');
      },
    }
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedUrls.push(response.data.url);
      }

      setPhotos([...photos, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!issueDescription.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    if (issueDescription.length < 10) {
      toast.error('Issue description must be at least 10 characters');
      return;
    }

    createClaimMutation.mutate({
      orderId: orderId!,
      issueDescription: issueDescription.trim(),
      photos: photos.length > 0 ? photos : undefined,
    });
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const hasClaim = existingClaims && existingClaims.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-farmer-beige-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Warranty Claim</h1>
          <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
        </div>
      </div>

      {/* Existing Claim Warning */}
      {hasClaim && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Existing Warranty Claim</h3>
              <p className="text-yellow-800 text-sm">
                You already have a warranty claim for this order. Status: <span className="font-semibold">{existingClaims[0].status}</span>
              </p>
              <button
                onClick={() => navigate('/warranty/claims')}
                className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
              >
                View your claims
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center space-x-4 p-3 bg-farmer-beige-50 rounded-xl">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.qty} {item.product.unit} × ₹{item.unitPrice}
                </p>
              </div>
              <p className="font-semibold text-farmer-green-600">₹{item.qty * item.unitPrice}</p>
            </div>
          ))}
          <div className="pt-3 border-t border-farmer-beige-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-farmer-green-600">₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Describe Your Issue</h2>

        {/* Issue Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Please describe the issue with your order in detail..."
            rows={6}
            className="w-full px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200"
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {issueDescription.length}/1000 characters (minimum 10)
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photos (Optional)
          </label>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-farmer-beige-300 rounded-xl p-6 text-center hover:border-farmer-green-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-12 w-12 text-farmer-green-600 animate-bounce" />
                    <p className="text-farmer-green-600 font-medium">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">Click to upload photos</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 5MB each</p>
                  </>
                )}
              </label>
            </div>

            {/* Uploaded Photos Preview */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-farmer-beige-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Your claim will be reviewed by the farmer</li>
                <li>You'll receive updates on the claim status</li>
                <li>Resolution typically takes 3-5 business days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="flex-1 px-6 py-3 border-2 border-farmer-beige-300 text-gray-700 rounded-xl hover:bg-farmer-beige-50 font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createClaimMutation.isLoading || hasClaim || !issueDescription.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {createClaimMutation.isLoading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  );
}
