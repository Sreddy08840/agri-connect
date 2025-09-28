import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  RefreshCw,
  Package,
  User,
  Phone,
  Calendar,
  Wrench
} from 'lucide-react';

type OrphanedProduct = {
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  createdAt: string;
};

type CleanupResponse = {
  success: boolean;
  totalProducts: number;
  orphanedCount: number;
  orphanedProducts: OrphanedProduct[];
};

export default function SystemCleanupPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch orphaned products
  const { data, isLoading, error, refetch } = useQuery<CleanupResponse>(
    'orphaned-products',
    () => api.get('/admin/cleanup/orphaned-products').then(res => res.data),
    {
      staleTime: 30000, // 30 seconds
    }
  );

  // Fix orphaned products mutation
  const fixOrphanedMutation = useMutation(
    () => api.post('/admin/cleanup/fix-orphaned-products'),
    {
      onMutate: () => setIsFixing(true),
      onSuccess: (response) => {
        toast.success(response.data.message);
        queryClient.invalidateQueries('orphaned-products');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to fix orphaned products');
      },
      onSettled: () => setIsFixing(false),
    }
  );

  // Remove orphaned products mutation
  const removeOrphanedMutation = useMutation(
    () => api.delete('/admin/cleanup/remove-orphaned-products'),
    {
      onMutate: () => setIsRemoving(true),
      onSuccess: (response) => {
        toast.success(response.data.message);
        queryClient.invalidateQueries('orphaned-products');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to remove orphaned products');
      },
      onSettled: () => setIsRemoving(false),
    }
  );

  const handleFixOrphaned = () => {
    if (window.confirm('This will create farmer profiles for all orphaned products. Continue?')) {
      fixOrphanedMutation.mutate();
    }
  };

  const handleRemoveOrphaned = () => {
    if (window.confirm('This will permanently delete all orphaned products. This action cannot be undone. Continue?')) {
      removeOrphanedMutation.mutate();
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load cleanup data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wrench className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Cleanup</h1>
            <p className="text-gray-600">Manage orphaned products and system integrity</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : data?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orphaned Products</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : data?.orphanedCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Healthy Products</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : (data?.totalProducts || 0) - (data?.orphanedCount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orphaned Products Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Orphaned Products</h2>
            {data && data.orphanedCount > 0 && (
              <div className="flex space-x-3">
                <button
                  onClick={handleFixOrphaned}
                  disabled={isFixing || isRemoving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {isFixing ? 'Fixing...' : 'Fix All'}
                </button>
                <button
                  onClick={handleRemoveOrphaned}
                  disabled={isFixing || isRemoving}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isRemoving ? 'Removing...' : 'Remove All'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading cleanup data...</p>
            </div>
          ) : data && data.orphanedCount > 0 ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Found {data.orphanedCount} orphaned product{data.orphanedCount !== 1 ? 's' : ''}. 
                    These products belong to farmers who don't have farmer profiles.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.orphanedProducts.map((product) => (
                  <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">{product.productName}</h3>
                            <p className="text-sm text-gray-600">Product ID: {product.productId}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>{product.farmerName || 'No name'}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{product.farmerPhone}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Cleanup Options:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Fix All:</strong> Creates farmer profiles for all orphaned farmers (Recommended)</li>
                  <li><strong>Remove All:</strong> Permanently deletes all orphaned products (Cannot be undone)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">System is Clean</h3>
              <p className="mt-1 text-gray-600">
                No orphaned products found. All products have valid farmer profiles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
