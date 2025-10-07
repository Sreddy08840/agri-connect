import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Shield, Clock, CheckCircle, XCircle, Eye, Search } from 'lucide-react';

interface WarrantyClaim {
  id: string;
  orderId: string;
  issueDescription: string;
  status: string;
  requestDate: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  order: {
    orderNumber: string;
    total: number;
    items: Array<{
      product: {
        name: string;
      };
      qty: number;
    }>;
  };
  resolver?: {
    name: string;
  };
}

export default function WarrantyClaimsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: claims, isLoading } = useQuery<WarrantyClaim[]>(
    'warranty-claims',
    () => api.get('/warranty/claims').then(res => res.data)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'IN_REVIEW':
        return <Eye className="h-5 w-5 text-blue-600" />;
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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

  const filteredClaims = claims?.filter((claim) => {
    const matchesSearch = claim.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-2xl">
              <Shield className="h-8 w-8 text-farmer-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warranty Claims</h1>
              <p className="text-gray-600 mt-1">
                {claims?.length || 0} total claim{claims?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      {!filteredClaims || filteredClaims.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-farmer-beige-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'ALL' ? 'No claims found' : 'No warranty claims yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'You haven\'t filed any warranty claims yet'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              View Orders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/warranty/claims/${claim.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 bg-farmer-beige-100 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    {getStatusIcon(claim.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-farmer-green-700 transition-colors">
                        Order #{claim.order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-2">{claim.issueDescription}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Filed: {new Date(claim.requestDate).toLocaleDateString()}</span>
                      {claim.resolvedAt && (
                        <span>Resolved: {new Date(claim.resolvedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Order Total</p>
                  <p className="text-xl font-bold text-farmer-green-600">₹{claim.order.total}</p>
                </div>
              </div>

              {/* Products */}
              <div className="flex flex-wrap gap-2 mb-4">
                {claim.order.items.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-farmer-beige-50 text-gray-700 rounded-lg text-sm"
                  >
                    {item.product.name} ({item.qty})
                  </span>
                ))}
              </div>

              {/* Resolution Notes */}
              {claim.resolutionNotes && (
                <div className="bg-farmer-beige-50 rounded-xl p-4 border-l-4 border-farmer-green-500">
                  <p className="text-sm font-medium text-gray-900 mb-1">Resolution Notes:</p>
                  <p className="text-sm text-gray-700">{claim.resolutionNotes}</p>
                  {claim.resolver && (
                    <p className="text-xs text-gray-500 mt-2">Resolved by: {claim.resolver.name}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
