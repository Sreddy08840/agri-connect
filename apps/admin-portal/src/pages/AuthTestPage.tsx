import { useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function AuthTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const testAuth = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Step 1: Test admin login
      console.log('Step 1: Testing admin login...');
      const loginResponse = await api.post('/auth/login-password', {
        phone: '+918618808929',
        password: 'Santosh@1234'
      });

      if (loginResponse.data.success && loginResponse.data.pendingSessionId) {
        testResults.login = {
          status: 'SUCCESS - Step 1',
          pendingSessionId: loginResponse.data.pendingSessionId,
          devCode: loginResponse.data.code || 'No dev code'
        };

        // Step 2: Verify OTP (using development code if available)
        const otpCode = loginResponse.data.code || '123456'; // fallback code
        try {
          console.log('Step 2: Verifying OTP...');
          const otpResponse = await api.post('/auth/otp/verify-2fa', {
            pendingSessionId: loginResponse.data.pendingSessionId,
            code: otpCode
          });

          if (otpResponse.data.accessToken) {
            testResults.otpVerification = {
              status: 'SUCCESS',
              token: otpResponse.data.accessToken.substring(0, 20) + '...'
            };

            // Set the token for subsequent requests
            localStorage.setItem('adminAccessToken', otpResponse.data.accessToken);
            localStorage.setItem('adminRefreshToken', otpResponse.data.refreshToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${otpResponse.data.accessToken}`;

            // Step 3: Test users endpoint
            try {
              console.log('Step 3: Testing users endpoint...');
              const usersResponse = await api.get('/users');
              testResults.users = {
                status: 'SUCCESS',
                count: usersResponse.data?.users?.length || usersResponse.data?.length || 0
              };
            } catch (error: any) {
              testResults.users = {
                status: 'ERROR',
                error: error.response?.data?.error || error.message
              };
            }

            // Step 4: Test products endpoint
            try {
              console.log('Step 4: Testing products endpoint...');
              const productsResponse = await api.get('/products/admin/list?status=ALL');
              testResults.products = {
                status: 'SUCCESS',
                count: productsResponse.data?.products?.length || productsResponse.data?.length || 0
              };
            } catch (error: any) {
              testResults.products = {
                status: 'ERROR',
                error: error.response?.data?.error || error.message
              };
            }

            // Step 5: Test orders endpoint
            try {
              console.log('Step 5: Testing orders endpoint...');
              const ordersResponse = await api.get('/orders');
              testResults.orders = {
                status: 'SUCCESS',
                count: ordersResponse.data?.orders?.length || ordersResponse.data?.length || 0
              };
            } catch (error: any) {
              testResults.orders = {
                status: 'ERROR',
                error: error.response?.data?.error || error.message
              };
            }

          } else {
            testResults.otpVerification = {
              status: 'ERROR',
              error: 'No access token received from OTP verification'
            };
          }
        } catch (error: any) {
          testResults.otpVerification = {
            status: 'ERROR',
            error: error.response?.data?.error || error.message
          };
        }

      } else {
        testResults.login = {
          status: 'ERROR',
          error: 'No access token received'
        };
      }

    } catch (error: any) {
      testResults.login = {
        status: 'ERROR',
        error: error.response?.data?.error || error.message
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Authentication Test'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-4">
            {Object.entries(results).map(([key, value]: [string, any]) => (
              <div key={key} className="border rounded p-3">
                <h4 className="font-medium capitalize">{key}</h4>
                <div className={`text-sm mt-1 ${value.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {value.status}
                </div>
                {value.error && (
                  <div className="text-red-600 text-sm mt-1">Error: {value.error}</div>
                )}
                {value.count !== undefined && (
                  <div className="text-blue-600 text-sm mt-1">Count: {value.count}</div>
                )}
                {value.token && (
                  <div className="text-gray-600 text-sm mt-1">Token: {value.token}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
