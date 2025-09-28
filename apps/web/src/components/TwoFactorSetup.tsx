import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, Copy, Eye, EyeOff, X, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

const tokenSchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
});

type TokenFormData = z.infer<typeof tokenSchema>;

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TwoFactorSetup({ isOpen, onClose, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<any>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const form = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { token: '' }
  });

  // Get 2FA status
  const { data: statusData } = useQuery(
    '2fa-status',
    () => api.get('/users/me/2fa/status').then(res => res.data),
    { enabled: isOpen }
  );

  // Setup 2FA mutation
  const setupMutation = useMutation(
    () => api.post('/users/me/2fa/setup'),
    {
      onSuccess: (res) => {
        setSetupData(res.data);
        setStep('verify');
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to setup 2FA');
      }
    }
  );

  // Enable 2FA mutation
  const enableMutation = useMutation(
    (data: TokenFormData) => api.post('/users/me/2fa/enable', data),
    {
      onSuccess: (res) => {
        setSetupData((prev: any) => ({ ...prev, backupCodes: res.data.backupCodes }));
        setStep('complete');
        toast.success('2FA enabled successfully!');
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to enable 2FA');
      }
    }
  );

  // Disable 2FA mutation
  const disableMutation = useMutation(
    (data: TokenFormData) => api.post('/users/me/2fa/disable', data),
    {
      onSuccess: () => {
        toast.success('2FA disabled successfully');
        form.reset();
        setStep('setup');
        onSuccess?.();
        onClose();
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to disable 2FA');
      }
    }
  );

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = (data: TokenFormData) => {
    enableMutation.mutate(data);
  };

  const handleDisable = (data: TokenFormData) => {
    disableMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleComplete = () => {
    form.reset();
    setStep('setup');
    setSetupData(null);
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  const isEnabled = statusData?.twoFactorEnabled;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isEnabled ? 'Disable Two-Factor Authentication' : 'Setup Two-Factor Authentication'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={setupMutation.isLoading || enableMutation.isLoading || disableMutation.isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEnabled ? (
          // Disable 2FA Form
          <div>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-sm text-yellow-800">
                  Disabling 2FA will make your account less secure. Enter your authenticator code to confirm.
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(handleDisable)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  {...form.register('token')}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                {form.formState.errors.token && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.token.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={disableMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Disable 2FA
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // Enable 2FA Flow
          <>
            {step === 'setup' && (
              <div>
                <p className="text-gray-600 mb-6">
                  Two-factor authentication adds an extra layer of security to your account. 
                  You'll need an authenticator app like Google Authenticator or Authy.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetup} loading={setupMutation.isLoading}>
                    Setup 2FA
                  </Button>
                </div>
              </div>
            )}

            {step === 'verify' && setupData && (
              <div>
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Step 1: Scan QR Code</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Scan this QR code with your authenticator app:
                    </p>
                    <div className="bg-white p-4 rounded border inline-block">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  <h4 className="font-medium mb-2">Or enter this key manually:</h4>
                  <div className="flex items-center space-x-2 mb-4">
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 font-mono">
                      {setupData.manualEntryKey}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(setupData.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step 2: Enter Verification Code
                    </label>
                    <input
                      type="text"
                      {...form.register('token')}
                      className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code from your app"
                      maxLength={6}
                    />
                    {form.formState.errors.token && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.token.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={enableMutation.isLoading}>
                      Verify & Enable
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === 'complete' && setupData && (
              <div>
                <div className="text-center mb-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    2FA Enabled Successfully!
                  </h4>
                  <p className="text-gray-600">
                    Your account is now protected with two-factor authentication.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Backup Codes</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {showBackupCodes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 mb-3">
                        Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {setupData.backupCodes?.map((code: string, index: number) => (
                          <code key={index} className="bg-white px-2 py-1 rounded text-sm font-mono">
                            {code}
                          </code>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.backupCodes?.join('\n'))}
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All Codes
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleComplete}>
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
