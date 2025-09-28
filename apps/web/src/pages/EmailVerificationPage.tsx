import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Button from '../components/ui/Button';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await api.post('/users/email/verify', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Failed to verify email. The link may be invalid or expired.');
        toast.error('Failed to verify email');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Email Verified Successfully!
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleGoToProfile}
                  className="w-full"
                >
                  Go to Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGoToLogin}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Verification Failed
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleGoToProfile}
                  className="w-full"
                >
                  Go to Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGoToLogin}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
