import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import { Shield, ArrowLeft, Clock, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

export default function WarrantyManagementPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: claim, isLoading } = useQuery(
    ['warranty-claim', claimId],
    () => api.get(`/warranty/claims/${claimId}`).then(res => res.data),
    { enabled: !!claimId }
  );

  const updateClaimMutation = useMutation(
    (data: { status: string; resolutionNotes?: string }) =>
      api.patch(`/warranty/claims/${claimId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['warranty-claim', claimId]);
        queryClient.invalidateQueries('warranty-claims');
        toast.success('Warranty claim updated successfully!');
        setStatus('');
        setResolutionNotes('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update warranty claim');
      },
    }
  );

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      toast.error('Please select a status');
      return;
    }

    updateClaimMutation.mutate({
      status,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'IN_REVIEW':
        return <Eye className="h-6 w-6 text-blue-600" />;
      case 'RESOLVED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const parsePhotos = (photos: string | null) => {
    if (!photos) return [];
    try {
      return JSON.parse(photos);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-green-600"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Warranty claim not found</p>
      </div>
    );
  }

  const photos = parsePhotos(claim.photos);
  const canUpdate = user?.role === 'FARMER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-farmer-beige-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-4 flex-1">
          <div className="p-4 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-2xl">
            <Shield className="h-8 w-8 text-farmer-green-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warranty Claim Details</h1>
            <p className="text-gray-600 mt-1">Order #{claim.order.orderNumber}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${getStatusColor(claim.status)} flex items-center space-x-2`}>
          {getStatusIcon(claim.status)}
          <span>{claim.status.replace('_', ' ')}</span>
        </span>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{claim.customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{claim.customer.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium text-gray-900">{claim.customer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Filed Date</p>
            <p className="font-medium text-gray-900">{new Date(claim.requestDate).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
        <div className="space-y-3">
          {claim.order.items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-farmer-beige-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.qty} × ₹{item.unitPrice}
                </p>
              </div>
              <p className="font-semibold text-farmer-green-600">₹{item.qty * item.unitPrice}</p>
            </div>
          ))}
          <div className="pt-3 border-t border-farmer-beige-200 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-farmer-green-600">₹{claim.order.total}</span>
          </div>
        </div>
      </div>

      {/* Issue Description */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Issue Description</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{claim.issueDescription}</p>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attached Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo: string, index: number) => (
              <a
                key={index}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden border-2 border-farmer-beige-200 hover:border-farmer-green-400 transition-colors"
              >
                <img
                  src={photo}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Information */}
      {claim.resolutionNotes && (
        <div className="bg-gradient-to-br from-farmer-beige-50 to-farmer-beige-100 rounded-2xl border-2 border-farmer-green-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resolution</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{claim.resolutionNotes}</p>
          {claim.resolver && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Resolved by: <span className="font-medium text-gray-900">{claim.resolver.name}</span></span>
              {claim.resolvedAt && (
                <span className="text-gray-600">{new Date(claim.resolvedAt).toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Update Status Form (Farmer/Admin Only) */}
      {canUpdate && (
        <form onSubmit={handleUpdateStatus} className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6 space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-farmer-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Update Claim Status</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200 font-medium"
              required
            >
              <option value="">Select status...</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about the resolution (optional)..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={updateClaimMutation.isLoading || !status}
            className="w-full px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {updateClaimMutation.isLoading ? 'Updating...' : 'Update Status'}
          </button>
        </form>
      )}
    </div>
  );
}
