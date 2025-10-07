import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Lock, Phone } from 'lucide-react';

const adminLoginSchema = z.object({
  phone: z.string().min(5, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState('');
  const [devOTPCode, setDevOTPCode] = useState('');
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const credentialsForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      phone: '+918618808929', // Pre-fill admin phone
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
      onSuccess: (response) => {
        const { pendingSessionId, code } = response.data as { pendingSessionId: string; code?: string };
        setPendingSessionId(pendingSessionId);
        setStep('otp');
        if (code) {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-admin-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-admin-600 rounded-full mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-300">
            {step === 'credentials' ? 'Secure Admin Access' : 'Enter verification code'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/20">
          {step === 'credentials' ? (
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Admin Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    {...credentialsForm.register('phone')}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500 text-white placeholder-gray-400"
                    placeholder="+918618808929"
                  />
                </div>
                {credentialsForm.formState.errors.phone && (
                  <p className="text-admin-400 text-sm mt-1">{credentialsForm.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...credentialsForm.register('password')}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500 text-white placeholder-gray-400"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {credentialsForm.formState.errors.password && (
                  <p className="text-admin-400 text-sm mt-1">{credentialsForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={startLoginMutation.isLoading}
                className="w-full bg-admin-600 hover:bg-admin-700 disabled:bg-admin-800 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {startLoginMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Access Admin Portal'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  {...otpForm.register('code')}
                  className="w-full px-4 py-3 text-center text-2xl font-mono bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500 text-white placeholder-gray-400"
                  placeholder="000000"
                  maxLength={6}
                />
                {otpForm.formState.errors.code && (
                  <p className="text-admin-400 text-sm mt-1">{otpForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* Development OTP Display */}
              {devOTPCode && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-sm text-yellow-200">
                    <strong>Development Code:</strong> {devOTPCode}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={verifyOTPMutation.isLoading}
                className="w-full bg-admin-600 hover:bg-admin-700 disabled:bg-admin-800 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {verifyOTPMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Access'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={goBack}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Agri-Connect Admin Portal v1.0
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
