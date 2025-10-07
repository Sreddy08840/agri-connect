import { useState } from 'react';
import { Users } from 'lucide-react';

export default function TestUsersPage() {
  const [testData] = useState([
    { id: '1', name: 'John Farmer', phone: '+919876543210', role: 'FARMER', verified: true },
    { id: '2', name: 'Jane Customer', phone: '+919876543211', role: 'CUSTOMER', verified: false },
    { id: '3', name: 'Admin User', phone: '+918618808929', role: 'ADMIN', verified: true },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management (Test)</h1>
          <p className="text-gray-600">Test page with mock data</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-white px-3 py-2 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-600">Total Users: </span>
            <span className="font-semibold">{testData.length}</span>
          </div>
        </div>
      </div>

      {/* Test Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testData.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'FARMER'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${user.verified ? 'text-green-600' : 'text-red-600'}`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-5 w-5 text-yellow-400">⚠️</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Test Page
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This is a test page with mock data. The real Users page might be failing due to API issues.
                Check the browser console for errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
