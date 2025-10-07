import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const results: any = {};

    // Test admin token
    const adminToken = localStorage.getItem('adminAccessToken');
    results.adminToken = adminToken ? `Present: ${adminToken.substring(0, 20)}...` : 'Missing';

    // Test admin login if no token
    if (!adminToken) {
      try {
        console.log('Testing admin login...');
        const loginResponse = await api.post('/auth/login-password', {
          phone: '+918618808929',
          password: 'Santosh@1234'
        });
        
        if (loginResponse.data.success && loginResponse.data.pendingSessionId) {
          // Complete 2FA with development OTP
          const otpCode = loginResponse.data.code || '123456';
          const otpResponse = await api.post('/auth/otp/verify-2fa', {
            pendingSessionId: loginResponse.data.pendingSessionId,
            code: otpCode
          });
          
          if (otpResponse.data.accessToken) {
            localStorage.setItem('adminAccessToken', otpResponse.data.accessToken);
            localStorage.setItem('adminRefreshToken', otpResponse.data.refreshToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${otpResponse.data.accessToken}`;
            results.adminLogin = {
              status: 'SUCCESS',
              message: 'Admin login successful (2FA completed)'
            };
            // Update token status
            results.adminToken = `Present: ${otpResponse.data.accessToken.substring(0, 20)}...`;
          }
        }
      } catch (error: any) {
        results.adminLogin = {
          status: 'ERROR',
          error: error.response?.data?.error || error.message,
          statusCode: error.response?.status
        };
      }
    }

    try {
      // Test users endpoint
      console.log('Testing /users endpoint...');
      const usersResponse = await api.get('/users');
      results.users = {
        status: 'SUCCESS',
        count: usersResponse.data?.users?.length || usersResponse.data?.length || 0,
        data: usersResponse.data
      };
    } catch (error: any) {
      results.users = {
        status: 'ERROR',
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status
      };
    }

    try {
      // Test products endpoint
      console.log('Testing /products/admin/list endpoint...');
      const productsResponse = await api.get('/products/admin/list?status=ALL');
      results.products = {
        status: 'SUCCESS',
        count: productsResponse.data?.products?.length || productsResponse.data?.length || 0,
        data: productsResponse.data,
        fullResponse: productsResponse.data
      };
    } catch (error: any) {
      results.products = {
        status: 'ERROR',
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status,
        fullError: error
      };
    }

    try {
      // Test orders endpoint
      console.log('Testing /orders endpoint...');
      const ordersResponse = await api.get('/orders');
      results.orders = {
        status: 'SUCCESS',
        count: ordersResponse.data?.orders?.length || ordersResponse.data?.length || 0,
        data: ordersResponse.data
      };
    } catch (error: any) {
      results.orders = {
        status: 'ERROR',
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">API Test Page</h1>
        <button
          onClick={testEndpoints}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Refresh Tests'}
        </button>
      </div>

      {/* Admin Token Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="font-medium w-32">Admin Token:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              testResults.adminToken?.includes('Present') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {testResults.adminToken || 'Loading...'}
            </span>
          </div>
          {testResults.adminLogin && (
            <div className="flex items-center">
              <span className="font-medium w-32">Admin Login:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.adminLogin.status === 'SUCCESS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.adminLogin.status}
              </span>
              {testResults.adminLogin.error && (
                <span className="ml-2 text-red-600 text-sm">{testResults.adminLogin.error}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* API Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Users API Test</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-20">Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.users?.status === 'SUCCESS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.users?.status || 'Loading...'}
              </span>
            </div>
            {testResults.users?.status === 'SUCCESS' && (
              <div className="flex items-center">
                <span className="font-medium w-20">Count:</span>
                <span className="text-blue-600 font-semibold">{testResults.users.count}</span>
              </div>
            )}
            {testResults.users?.error && (
              <div className="mt-2">
                <span className="font-medium">Error:</span>
                <p className="text-red-600 text-sm mt-1">{testResults.users.error}</p>
                {testResults.users.statusCode && (
                  <p className="text-gray-500 text-sm">Status Code: {testResults.users.statusCode}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Products API Test</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-20">Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.products?.status === 'SUCCESS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.products?.status || 'Loading...'}
              </span>
            </div>
            {testResults.products?.status === 'SUCCESS' && (
              <div className="flex items-center">
                <span className="font-medium w-20">Count:</span>
                <span className="text-blue-600 font-semibold">{testResults.products.count}</span>
              </div>
            )}
            {testResults.products?.error && (
              <div className="mt-2">
                <span className="font-medium">Error:</span>
                <p className="text-red-600 text-sm mt-1">{testResults.products.error}</p>
                {testResults.products.statusCode && (
                  <p className="text-gray-500 text-sm">Status Code: {testResults.products.statusCode}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Orders Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Orders API Test</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-20">Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.orders?.status === 'SUCCESS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.orders?.status || 'Loading...'}
              </span>
            </div>
            {testResults.orders?.status === 'SUCCESS' && (
              <div className="flex items-center">
                <span className="font-medium w-20">Count:</span>
                <span className="text-blue-600 font-semibold">{testResults.orders.count}</span>
              </div>
            )}
            {testResults.orders?.error && (
              <div className="mt-2">
                <span className="font-medium">Error:</span>
                <p className="text-red-600 text-sm mt-1">{testResults.orders.error}</p>
                {testResults.orders.statusCode && (
                  <p className="text-gray-500 text-sm">Status Code: {testResults.orders.statusCode}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw Data Display */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Raw API Responses</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-5 w-5 text-blue-400">ℹ️</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              API Testing Instructions
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This page tests the admin portal's connection to the backend API. 
                Check the results above to diagnose any issues with data fetching.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Green status = API working correctly</li>
                <li>Red status = API error (check error details)</li>
                <li>Count shows number of records returned</li>
                <li>Raw responses show the actual API data structure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
