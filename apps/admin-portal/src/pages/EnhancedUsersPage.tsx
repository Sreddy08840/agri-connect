import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Search, Filter, UserCheck, UserX, Users as UsersIcon, Eye, Download } from 'lucide-react';

type UserRow = {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  googleId?: string | null;
  role: 'CUSTOMER' | 'FARMER' | 'ADMIN';
  verified: boolean;
  createdAt: string;
};

export default function EnhancedUsersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch users with React Query
  const { data, isLoading, error } = useQuery(
    ['admin-users', q, role, page],
    async () => {
      const params: any = { page, limit: 20 };
      if (q) params.q = q;
      if (role) params.role = role;
      const res = await api.get('/users', { params });
      return res.data;
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  // User verification mutation
  const verifyUserMutation = useMutation(
    ({ userId, verified }: { userId: string; verified: boolean }) =>
      api.patch(`/users/${userId}/verify`, { verified: !verified }),
    {
      onSuccess: (_, { verified }) => {
        toast.success(`User ${!verified ? 'verified' : 'unverified'} successfully`);
        queryClient.invalidateQueries(['admin-users']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update verification status');
      },
    }
  );

  // User impersonation mutation
  const impersonateMutation = useMutation(
    (userId: string) => api.post(`/users/${userId}/impersonate`),
    {
      onSuccess: (response) => {
        const { accessToken, refreshToken, user } = response.data;
        
        // Save current admin tokens
        try {
          if (!sessionStorage.getItem('admin_accessToken')) {
            const curAT = localStorage.getItem('adminAccessToken') || '';
            const curRT = localStorage.getItem('adminRefreshToken') || '';
            sessionStorage.setItem('admin_accessToken', curAT);
            sessionStorage.setItem('admin_refreshToken', curRT);
          }
        } catch (e) {
          console.error('Failed to save admin tokens:', e);
        }
        
        // Set impersonated user tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        toast.success(`Impersonating ${user.role}: ${user.name || user.phone}`);
        
        // Redirect based on user role
        if (user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else if (user.role === 'FARMER') {
          window.location.href = '/farmer';
        } else {
          window.location.href = '/home';
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to impersonate user');
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!users || users.length === 0) {
      toast.error('No users to export');
      return;
    }

    try {
      const headers = ['Name', 'Phone', 'Email', 'Google ID', 'Role', 'Verified', 'Created At'];
      const csvRows = [headers.join(',')];

      users.forEach((user: any) => {
        const row = [
          user?.name || 'N/A',
          user?.phone || 'N/A',
          user?.email || 'N/A',
          user?.googleId || 'N/A',
          user?.role || 'N/A',
          user?.verified ? 'Yes' : 'No',
          user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
        ];
        csvRows.push(row.map(cell => `"${cell}"`).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Users exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    }
  };

  const handleExportJSON = () => {
    if (!users || users.length === 0) {
      toast.error('No users to export');
      return;
    }

    try {
      const jsonContent = JSON.stringify(users, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Users exported as JSON successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    }
  };

  const toggleVerification = (userId: string, currentVerified: boolean) => {
    setVerifying(userId);
    verifyUserMutation.mutate(
      { userId, verified: currentVerified },
      {
        onSettled: () => setVerifying(null),
      }
    );
  };

  const handleImpersonate = (userId: string) => {
    setImpersonating(userId);
    impersonateMutation.mutate(userId, {
      onSettled: () => setImpersonating(null),
    });
  };

  const users = data?.users || [];
  const pagination = data?.pagination || { pages: 1 };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load users. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportCSV}
          disabled={!users || users.length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={!users || users.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, phone, or email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="FARMER">Farmer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: UserRow) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0).toUpperCase() || user.phone.charAt(-2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.phone && <div>📱 {user.phone}</div>}
                      {user.email && <div className="text-gray-600">✉️ {user.email}</div>}
                      {user.googleId && <div className="text-gray-500 text-xs">🔗 Google: {user.googleId.substring(0, 12)}...</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'FARMER' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleVerification(user.id, user.verified)}
                      disabled={verifying === user.id || impersonating !== null}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                        user.verified
                          ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                          : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                      }`}
                    >
                      {verifying === user.id ? (
                        'Updating...'
                      ) : (
                        <>
                          {user.verified ? (
                            <><UserX className="h-3 w-3 mr-1" /> Unverify</>
                          ) : (
                            <><UserCheck className="h-3 w-3 mr-1" /> Verify</>
                          )}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleImpersonate(user.id)}
                      disabled={impersonating !== null || verifying !== null}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {impersonating === user.id ? (
                        'Impersonating...'
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" /> Impersonate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {q || role ? 'Try adjusting your search criteria.' : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>

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
    </div>
  );
}
