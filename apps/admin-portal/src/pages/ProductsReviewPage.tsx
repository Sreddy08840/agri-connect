import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import adminSocket from '../lib/socket';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Star, 
  StarOff,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';

type ProductStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  stockQty: number;
  status: ProductStatus;
  featured: boolean;
  images?: string[] | null;
  imageUrl?: string | null;
  category: {
    id: string;
    name: string;
  };
  farmer: {
    id: string;
    name: string;
    phone?: string;
    farmerProfile?: { businessName?: string | null };
  };
  createdAt: string;
};

export default function ProductsReviewPage() {
  const [status, setStatus] = useState<ProductStatus>('PENDING_REVIEW');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasonModal, setReasonModal] = useState<{ open: boolean; mode: 'single' | 'bulk'; productId?: string | null; nextStatus?: 'APPROVED' | 'REJECTED' }>(() => ({ open: false, mode: 'single', productId: null }));
  const [reasonText, setReasonText] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery(
    ['categories'],
    async () => {
      const res = await api.get('/categories');
      return res.data?.categories || res.data || [];
    },
    { staleTime: 300000 } // 5 minutes
  );

  // Socket: live updates
  useEffect(() => {
    const sock = adminSocket.connect();
    adminSocket.joinAdminRoom();

    const onNew = () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-pending-count']);
    };
    const onStatus = () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-pending-count']);
    };

    adminSocket.onProductNew(onNew);
    adminSocket.onProductStatus(onStatus);

    return () => {
      adminSocket.offProductNew(onNew);
      adminSocket.offProductStatus(onStatus);
      adminSocket.leaveAdminRoom();
      // Do not hard disconnect to allow other listeners in other pages
    };
  }, [queryClient]);

  // Fetch products
  const { data, isLoading, error } = useQuery(
    ['admin-products', status, q, category, page],
    async () => {
      try {
        const params: any = { status, page, limit: 12 };
        if (q) params.q = q;
        if (category) params.category = category;
        const res = await api.get('/products/admin/list', { params });
        return res.data;
      } catch (err: any) {
        console.warn('Primary products fetch failed, retrying with status=ALL', err?.response?.data || err);
        try {
          const fallbackRes = await api.get('/products/admin/list', { params: { status: 'ALL', page, limit: 12 } });
          return fallbackRes.data;
        } catch (err2: any) {
          console.warn('Fallback products fetch failed, retrying minimal', err2?.response?.data || err2);
          const minimalRes = await api.get('/products/admin/list');
          return minimalRes.data;
        }
      }
    },
    { 
      keepPreviousData: true,
      staleTime: 30000 // 30 seconds
    }
  );

  // Update product status mutation
  const updateStatusMutation = useMutation(
    ({ id, nextStatus, reason }: { id: string; nextStatus: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.patch(`/products/${id}/status`, { status: nextStatus, reason }),
    {
      onSuccess: (_, { nextStatus }) => {
        toast.success(`Product ${nextStatus.toLowerCase()} successfully`);
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-pending-count']);
        setSelectedProduct(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update product status');
      },
    }
  );

  // Bulk status update
  const bulkStatusMutation = useMutation(
    ({ ids, nextStatus, reason }: { ids: string[]; nextStatus: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.patch('/products/admin/bulk-status', { ids, status: nextStatus, reason }),
    {
      onSuccess: () => {
        toast.success('Bulk status update successful');
        setSelectedIds(new Set());
        setReasonModal({ open: false, mode: 'bulk', productId: null, nextStatus: undefined });
        setReasonText('');
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-pending-count']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Bulk update failed');
      }
    }
  );

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation(
    ({ id, featured }: { id: string; featured: boolean }) =>
      api.patch(`/products/admin/${id}/feature`, { featured }),
    {
      onSuccess: (_, { featured }) => {
        toast.success(`Product ${featured ? 'featured' : 'unfeatured'} successfully`);
        queryClient.invalidateQueries(['admin-products']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update featured status');
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleStatusUpdate = (productId: string, nextStatus: 'APPROVED' | 'REJECTED') => {
    if (nextStatus === 'REJECTED') {
      setReasonText('');
      setReasonModal({ open: true, mode: 'single', productId, nextStatus });
      return;
    }
    updateStatusMutation.mutate({ id: productId, nextStatus });
  };

  const handleBulkUpdate = (nextStatus: 'APPROVED' | 'REJECTED') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('No products selected');
      return;
    }
    if (nextStatus === 'REJECTED') {
      setReasonText('');
      setReasonModal({ open: true, mode: 'bulk', productId: null, nextStatus });
      return;
    }
    bulkStatusMutation.mutate({ ids, nextStatus });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAllOnPage = () => {
    const ids = products.map((p: Product) => p.id);
    setSelectedIds(new Set(ids));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleToggleFeatured = (productId: string, currentFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id: productId, featured: !currentFeatured });
  };

  const getImageUrl = (images: unknown, fallback?: string | null) => {
    if (fallback && typeof fallback === 'string') return fallback;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      return typeof first === 'string' && first.startsWith('http')
        ? first
        : typeof first === 'string'
          ? `http://localhost:8080${first}`
          : null;
    }
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed[0]) {
          return String(parsed[0]).startsWith('http') ? String(parsed[0]) : `http://localhost:8080${String(parsed[0])}`;
        }
      } catch {
        return images.startsWith('http') ? images : `http://localhost:8080${images}`;
      }
    }
    return null;
  };

  const normalizeProducts = (d: any): { products: any[]; pagination: any } => {
    try {
      if (!d) return { products: [], pagination: { pages: 1 } };
      if (Array.isArray(d)) return { products: d, pagination: { pages: 1 } };
      if (Array.isArray(d?.products)) return { products: d.products, pagination: d.pagination || { pages: 1 } };
      if (d?.data) {
        if (Array.isArray(d.data)) return { products: d.data, pagination: { pages: 1 } };
        if (Array.isArray(d.data?.products)) return { products: d.data.products, pagination: d.data.pagination || { pages: 1 } };
      }
      return { products: [], pagination: { pages: 1 } };
    } catch {
      return { products: [], pagination: { pages: 1 } };
    }
  };
  const { products, pagination } = normalizeProducts(data);

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const statusCode = (error as any)?.response?.status;
    const errMsg = (error as any)?.response?.data?.error || (error as any)?.message || 'Unknown error';
    if (statusCode === 401) {
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 font-medium">Authentication required</p>
            <p className="text-yellow-600 text-sm mt-1">Please log in to review products.</p>
            <button onClick={() => window.location.href = '/login'} className="mt-3 btn-primary">Go to Login</button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load products. Please try again.</p>
          <p className="text-red-600 text-sm mt-2">Error: {errMsg}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="select-primary"
              >
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or description"
                  className="input-primary pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select-primary pl-10"
                >
                  <option value="">All Categories</option>
                  {(categories as any[])?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bulk actions toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
        <div className="flex gap-2">
          <button onClick={selectAllOnPage} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Select All</button>
          <button onClick={clearSelection} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Clear</button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleBulkUpdate('APPROVED')}
            disabled={selectedIds.size === 0 || bulkStatusMutation.isLoading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded disabled:opacity-50"
          >Approve Selected</button>
          <button
            onClick={() => handleBulkUpdate('REJECTED')}
            disabled={selectedIds.size === 0 || bulkStatusMutation.isLoading}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded disabled:opacity-50"
          >Reject Selected</button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: Product) => (
          <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Product Image */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
              {getImageUrl(product.images, product.imageUrl) ? (
                <img
                  src={getImageUrl(product.images, product.imageUrl)!}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }}
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Featured Badge */}
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </span>
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                  {getStatusIcon(product.status)}
                  <span className="ml-1">{product.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            {/* Selection Checkbox */}
            <div className="p-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} />
                Select
              </label>
            </div>
            {/* Product Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>₹{product.price}/{product.unit}</span>
                    <span>{product.stockQty} {product.unit} available</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Category: {product.category.name}</p>
                    <p>Farmer: {product.farmer.farmerProfile?.businessName || product.farmer.name}</p>
                    <p>Contact: {product.farmer.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </button>

                {product.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(product.id, 'APPROVED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </button>
                  </>
                )}

                {product.status === 'APPROVED' && (
                  <button
                    onClick={() => handleToggleFeatured(product.id, product.featured)}
                    disabled={toggleFeaturedMutation.isLoading}
                    className={`flex items-center px-3 py-1 text-xs font-medium rounded-md disabled:opacity-50 ${
                      product.featured
                        ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {product.featured ? (
                      <><StarOff className="h-3 w-3 mr-1" /> Unfeature</>
                    ) : (
                      <><Star className="h-3 w-3 mr-1" /> Feature</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {q || category ? 'Try adjusting your search criteria.' : `No ${status.toLowerCase().replace('_', ' ')} products available.`}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow p-6 w-96">
            <h3 className="text-lg font-semibold mb-2">{reasonModal.mode === 'bulk' ? 'Reject Selected Products' : 'Reject Product'}</h3>
            <p className="text-sm text-gray-600 mb-3">Provide a reason (visible to the farmer)</p>
            <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} rows={4} className="w-full border rounded p-2" placeholder="Reason..." />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setReasonModal({ open: false, mode: 'single', productId: null }); setReasonText(''); }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
              <button
                onClick={() => {
                  if (reasonModal.mode === 'single' && reasonModal.productId && reasonModal.nextStatus) {
                    updateStatusMutation.mutate({ id: reasonModal.productId, nextStatus: reasonModal.nextStatus, reason: reasonText });
                    setReasonModal({ open: false, mode: 'single', productId: null, nextStatus: undefined });
                    setReasonText('');
                  } else if (reasonModal.mode === 'bulk' && reasonModal.nextStatus) {
                    bulkStatusMutation.mutate({ ids: Array.from(selectedIds), nextStatus: reasonModal.nextStatus, reason: reasonText });
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Product Image */}
                {getImageUrl(selectedProduct.images, selectedProduct.imageUrl) && (
                  <img
                    src={getImageUrl(selectedProduct.images, selectedProduct.imageUrl)!}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-md"
                  />
                )}
                
                {/* Product Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p>{selectedProduct.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <p>₹{selectedProduct.price}/{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <p>{selectedProduct.stockQty} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p>{selectedProduct.category.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Farmer:</span>
                    <p>{selectedProduct.farmer.farmerProfile?.businessName || selectedProduct.farmer.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contact:</span>
                    <p>{selectedProduct.farmer.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1">{selectedProduct.description}</p>
                </div>
                
                {/* Actions */}
                {selectedProduct.status === 'PENDING_REVIEW' && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedProduct.id, 'APPROVED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedProduct.id, 'REJECTED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Product
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
