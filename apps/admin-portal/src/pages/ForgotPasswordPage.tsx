import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, Phone, ArrowLeft, RefreshCw, Key, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  phone: z.string().min(5, 'Enter a valid phone number'),
});

const resetPasswordSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const [devOTPCode, setDevOTPCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const phoneForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    }
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Convert phone to E.164 format
  const toE164 = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+91${cleaned}`;
  };

  const forgotPasswordMutation = useMutation(
    (phone: string) => api.post('/auth/password/forgot', { phone }),
    {
      onSuccess: (response, phone) => {
        const { pendingSessionId, code } = response.data;
        setPendingSessionId(pendingSessionId);
        setStep('otp');
        setResendCooldown(30); // 30 second cooldown
        if (process.env.NODE_ENV === 'development' && code) {
          setDevOTPCode(code);
          toast.success(`OTP sent! Development code: ${code}`);
        } else {
          toast.success('OTP sent to your phone. Please enter the code.');
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to send OTP. Please check your phone number.');
      },
    }
  );

  const resendOTPMutation = useMutation(
    () => {
      const phone = toE164(phoneForm.getValues('phone'));
      return api.post('/auth/password/forgot', { phone });
    },
    {
      onSuccess: (response) => {
        const { code } = response.data;
        setResendCooldown(30);
        if (process.env.NODE_ENV === 'development' && code) {
          setDevOTPCode(code);
          toast.success(`OTP resent! Development code: ${code}`);
        } else {
          toast.success('OTP resent to your phone.');
        }
      },
      onError: () => {
        toast.error('Failed to resend OTP. Please try again.');
      },
    }
  );

  const resetPasswordMutation = useMutation(
    (data: ResetPasswordFormData) => api.post('/auth/password/reset', {
      pendingSessionId,
      code: data.code,
      newPassword: data.newPassword,
    }),
    {
      onSuccess: () => {
        toast.success('Password reset successfully! You can now login with your new password.');
        navigate('/login');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to reset password. Please try again.');
      },
    }
  );

  const handleResendOTP = () => {
    if (resendCooldown === 0) {
      resendOTPMutation.mutate();
    }
  };

  const onPhoneSubmit = (data: ForgotPasswordFormData) => {
    const e164Phone = toE164(data.phone);
    forgotPasswordMutation.mutate(e164Phone);
  };

  const onResetSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  const goBack = () => {
    setStep('phone');
    setPendingSessionId('');
    setDevOTPCode('');
    phoneForm.reset();
    resetForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6 shadow-lg">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-red-100 text-lg">
            {step === 'phone' ? 'Enter your phone number to reset your password' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-red-800/30 backdrop-blur-sm border border-red-600/30 rounded-xl shadow-2xl p-8">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center text-sm text-red-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </button>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Admin Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-300 w-5 h-5" />
                  <input
                    type="tel"
                    {...phoneForm.register('phone')}
                    className="w-full pl-12 pr-4 py-4 bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-red-300 text-sm mt-2">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={forgotPasswordMutation.isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {forgotPasswordMutation.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send Reset OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={goBack}
                className="flex items-center text-sm text-red-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to phone
              </button>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  {...resetForm.register('code')}
                  className="w-full px-4 py-4 text-center text-2xl font-mono bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                {resetForm.formState.errors.code && (
                  <p className="text-red-300 text-sm mt-2">{resetForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  New Password
                </label>
                <input
                  type="password"
                  {...resetForm.register('newPassword')}
                  className="w-full px-4 py-4 bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  placeholder="Enter new password"
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-red-300 text-sm mt-2">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...resetForm.register('confirmPassword')}
                  className="w-full px-4 py-4 bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  placeholder="Confirm new password"
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-red-300 text-sm mt-2">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-200">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || resendOTPMutation.isLoading}
                  className="flex items-center text-sm text-red-300 hover:text-white disabled:text-red-500 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${resendOTPMutation.isLoading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={resetPasswordMutation.isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {resetPasswordMutation.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-red-200 text-sm mb-4">
            <p className="font-medium">Agri-Connect Admin Portal v1.0</p>
            <p className="text-red-300 text-xs">Secure Password Reset</p>
          </div>
        </div>
      </div>
    </div>
  );
}