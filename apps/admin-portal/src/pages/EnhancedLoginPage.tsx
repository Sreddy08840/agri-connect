import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Lock, Phone, ArrowLeft, RefreshCw } from 'lucide-react';

const adminLoginSchema = z.object({
  phone: z.string().min(5, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function EnhancedLoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState('');
  const [devOTPCode, setDevOTPCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastCredentials, setLastCredentials] = useState<{ phone: string; password: string } | null>(null);
  const { setUser } = useAuthStore();
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

  const credentialsForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      phone: '',
      password: ''
    }
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
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

  const startLoginMutation = useMutation(
    (payload: { phone: string; password: string }) => api.post('/auth/login-password', payload),
    {
      onSuccess: (response, variables) => {
        const { pendingSessionId, code } = response.data as { pendingSessionId: string; code?: string };
        setPendingSessionId(pendingSessionId);
        setLastCredentials(variables);
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
        toast.error(error.response?.data?.error || 'Admin login failed. Please check your credentials.');
      },
    }
  );

  const resendOTPMutation = useMutation(
    () => {
      if (!lastCredentials) throw new Error('No credentials available');
      return api.post('/auth/login-password', lastCredentials);
    },
    {
      onSuccess: (response) => {
        const { code } = response.data as { code?: string };
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

  const handleResendOTP = () => {
    if (resendCooldown === 0 && lastCredentials) {
      resendOTPMutation.mutate();
    }
  };

  const verifyOTPMutation = useMutation(
    (data: OTPFormData) => api.post('/auth/otp/verify-2fa', { pendingSessionId, code: data.code }),
    {
      onSuccess: (response) => {
        const { accessToken, refreshToken, user } = response.data;
        
        // Verify admin role
        if (user?.role !== 'ADMIN') {
          toast.error('Access denied. Admin privileges required.');
          return;
        }
        
        localStorage.setItem('adminAccessToken', accessToken);
        localStorage.setItem('adminRefreshToken', refreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);
        toast.success('Admin login successful!');
        navigate('/dashboard', { replace: true });
      },
      onError: (error: any) => {
        toast.error('Failed to verify OTP. Please try again.');
      },
    }
  );

  const onCredentialsSubmit = (data: AdminLoginFormData) => {
    const e164Phone = toE164(data.phone);
    const payload = { phone: e164Phone, password: data.password };
    startLoginMutation.mutate(payload);
  };

  const onOTPSubmit = (data: OTPFormData) => {
    verifyOTPMutation.mutate(data);
  };

  const goBack = () => {
    setStep('credentials');
    setPendingSessionId('');
    setDevOTPCode('');
    credentialsForm.reset();
    otpForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-red-100 text-lg">
            {step === 'credentials' ? 'Secure Admin Access' : 'Enter the OTP sent to your phone'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-red-800/30 backdrop-blur-sm border border-red-600/30 rounded-xl shadow-2xl p-8">
          {step === 'credentials' ? (
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Admin Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-300 w-5 h-5" />
                  <input
                    type="tel"
                    {...credentialsForm.register('phone')}
                    className="w-full pl-12 pr-4 py-4 bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>
                {credentialsForm.formState.errors.phone && (
                  <p className="text-red-300 text-sm mt-2">{credentialsForm.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-300 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...credentialsForm.register('password')}
                    className="w-full pl-12 pr-14 py-4 bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {credentialsForm.formState.errors.password && (
                  <p className="text-red-300 text-sm mt-2">{credentialsForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={startLoginMutation.isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {startLoginMutation.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Verifying...
                  </div>
                ) : (
                  'Access Admin Portal'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={goBack}
                className="flex items-center text-sm text-red-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </button>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-red-100 mb-3">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  {...otpForm.register('code')}
                  className="w-full px-4 py-4 text-center text-2xl font-mono bg-red-900/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                {otpForm.formState.errors.code && (
                  <p className="text-red-300 text-sm mt-2">{otpForm.formState.errors.code.message}</p>
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
                disabled={verifyOTPMutation.isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {verifyOTPMutation.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-red-200 text-sm mb-4">
            <p className="font-medium">Agri-Connect Admin Portal v1.0</p>
            <p className="text-red-300 text-xs">Authorized Personnel Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
