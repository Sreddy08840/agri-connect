import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const identifierSchema = z.object({
  identifier: z.string().min(1, 'Enter your email or phone number'),
});

const resetSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/\d/, 'Must include a digit')
    .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((val) => val.newPassword === val.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type IdentifierFormData = z.infer<typeof identifierSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState<'identifier' | 'reset'>('identifier');
  const [pendingResetId, setPendingResetId] = useState('');
  const [devOTPCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Watch form values for UI updates
  const watchedCode = resetForm.watch('code') || '';
  const watchedNewPassword = resetForm.watch('newPassword') || '';
  const watchedConfirmPassword = resetForm.watch('confirmPassword') || '';


  // Password strength calculation
  const computeStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 5);
  };

  const strength = computeStrength(watchedNewPassword);

  // Send OTP mutation
  const sendOTPMutation = useMutation(
    (phoneNumber: string) => api.post('/users/forgot-password', { identifier: phoneNumber }),
    {
      retry: false,
      onSuccess: (response) => {
        // Updated to match the new API response structure
        const { resetUrl } = response.data;
        
        // In development, we get the reset URL directly
        if (import.meta.env.VITE_NODE_ENV === 'development' && resetUrl) {
          // Extract token from URL for development mode
          const tokenMatch = resetUrl.match(/token=([^&]+)/);
          if (tokenMatch) {
            setPendingResetId(tokenMatch[1]);
            setStep('reset');
            toast.success('Reset link generated! Enter the OTP code.');
            return;
          }
        }
        
        toast.success('Reset instructions sent to your phone');
        setStep('reset');
      },
      onError: (error: any) => {
        console.error('Forgot password error:', error);
        const errorMessage = error.response?.data?.error || 'Failed to send reset instructions';
        toast.error(errorMessage);
      },
    }
  );

  // Reset password mutation
  const resetPasswordMutation = useMutation(
    (data: { code: string; newPassword: string }) =>
      api.post('/users/reset-password', {
        token: pendingResetId,
        newPassword: data.newPassword,
        confirmPassword: data.newPassword,
      }),
    {
      retry: false,
      onSuccess: () => {
        toast.success('Password reset successful! Please login with your new password.');
        onSuccess();
      },
      onError: (error: any) => {
        console.error('Reset password error:', error);
        const errorMessage = error.response?.data?.error || 'Failed to reset password';
        toast.error(errorMessage);
      },
    }
  );

  const onIdentifierSubmit = (data: IdentifierFormData) => {
    if (sendOTPMutation.isLoading) return;
    sendOTPMutation.mutate(data.identifier);
  };

  const onResetSubmit = (data: ResetFormData) => {
    resetPasswordMutation.mutate({
      code: data.code,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          {step === 'identifier' ? 'Forgot Password' : 'Reset Password'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {step === 'identifier' 
            ? 'Enter your email or phone number to reset your password'
            : 'Enter the code and your new password'
          }
        </p>
      </div>

      {step === 'identifier' && (
        <form onSubmit={identifierForm.handleSubmit(onIdentifierSubmit)} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
              Email or Phone Number
            </label>
            <div className="mt-1">
              <input
                {...identifierForm.register('identifier')}
                type="text"
                placeholder="email@example.com or +911234567890"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {identifierForm.formState.errors.identifier && (
              <p className="mt-1 text-sm text-red-600">
                {identifierForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={sendOTPMutation.isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium disabled:opacity-50"
            >
              {sendOTPMutation.isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
          {import.meta.env.VITE_NODE_ENV === 'development' && devOTPCode && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
              <strong>Dev Mode:</strong> OTP code is <code className="font-mono">{devOTPCode}</code>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              {...resetForm.register('code', {
                onChange: (e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  resetForm.setValue('code', onlyDigits);
                },
              })}
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg tracking-widest"
            />
            {resetForm.formState.errors.code && (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                {...resetForm.register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="block w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-green-600 hover:text-green-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {watchedNewPassword && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded transition-all ${
                      strength <= 1 ? 'bg-red-500 w-1/5' : 
                      strength === 2 ? 'bg-orange-500 w-2/5' : 
                      strength === 3 ? 'bg-yellow-500 w-3/5' : 
                      strength === 4 ? 'bg-green-500 w-4/5' : 
                      'bg-emerald-600 w-full'
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {strength <= 1 ? 'Very weak' : 
                   strength === 2 ? 'Weak' : 
                   strength === 3 ? 'Medium' : 
                   strength === 4 ? 'Strong' : 
                   'Very strong'}
                </p>
              </div>
            )}
            
            {resetForm.formState.errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              {...resetForm.register('confirmPassword')}
              type="password"
              placeholder="Confirm new password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {watchedConfirmPassword && watchedNewPassword !== watchedConfirmPassword && (
              <p className="mt-1 text-sm text-orange-600">Passwords do not match</p>
            )}
            {resetForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('identifier')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                resetPasswordMutation.isLoading ||
                watchedCode.length !== 6 ||
                watchedNewPassword.length < 8 ||
                watchedNewPassword !== watchedConfirmPassword
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium disabled:opacity-50"
            >
              {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
