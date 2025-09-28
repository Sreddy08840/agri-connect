import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';
import Button from './ui/Button';

export default function EmailVerification() {
  const [showVerificationUrl, setShowVerificationUrl] = useState(false);

  // Get email verification status
  const { data: emailStatus, refetch } = useQuery(
    'email-status',
    () => api.get('/users/me/email/status').then(res => res.data),
    {
      onError: (error: any) => {
        console.error('Failed to fetch email status:', error);
      }
    }
  );

  // Send verification email mutation
  const sendVerificationMutation = useMutation(
    () => api.post('/users/me/email/send-verification'),
    {
      onSuccess: (res) => {
        toast.success('Verification email sent successfully!');
        if (res.data.verificationUrl) {
          setShowVerificationUrl(true);
        }
        refetch();
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to send verification email');
      }
    }
  );

  const handleSendVerification = () => {
    sendVerificationMutation.mutate();
  };

  if (!emailStatus) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const { email, emailVerified, hasEmail } = emailStatus;

  if (!hasEmail) {
    return (
      <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <h3 className="font-medium text-yellow-800">No Email Address</h3>
            <p className="text-sm text-yellow-600">
              Add an email address to your profile to enable email verification and account recovery.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (emailVerified) {
    return (
      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <h3 className="font-medium text-green-800">Email Verified</h3>
              <p className="text-sm text-green-600">
                Your email address <strong>{email}</strong> has been verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-orange-500 mr-2" />
          <div>
            <h3 className="font-medium text-orange-800">Email Not Verified</h3>
            <p className="text-sm text-orange-600">
              Please verify your email address <strong>{email}</strong> to secure your account.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendVerification}
          loading={sendVerificationMutation.isLoading}
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Verification
        </Button>
      </div>

      {showVerificationUrl && sendVerificationMutation.data?.data?.verificationUrl && (
        <div className="mt-4 p-3 bg-white border border-orange-200 rounded">
          <p className="text-sm font-medium text-orange-800 mb-2">
            Development Mode - Verification Link:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono break-all">
              {sendVerificationMutation.data.data.verificationUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(sendVerificationMutation.data.data.verificationUrl);
                toast.success('Link copied to clipboard');
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            In production, this link would be sent via email.
          </p>
        </div>
      )}
    </div>
  );
}
