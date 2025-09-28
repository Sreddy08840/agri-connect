import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import ForgotPassword from '../components/ForgotPassword';

const credentialsSchema = z.object({
  phone: z.string().min(5, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot'>('credentials');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<'IN' | 'US' | 'GB' | 'AE' | 'SG' | 'AU' | 'CA'>('IN');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const [devLoginOTPCode, setDevLoginOTPCode] = useState('');
  const { setUser } = useAuthStore();
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const credentialsForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Watch OTP code so UI re-renders as user types
  const watchedOtpCode = otpForm.watch('code') || '';

  // Helpers: format input as user types (optional light formatting)
  function formatExampleForCountry(c: string) {
    switch (c) {
      case 'US': return '+14155551234';
      case 'GB': return '+447911123456';
      case 'AE': return '+971501234567';
      case 'SG': return '+6581234567';
      case 'AU': return '+61412345678';
      case 'CA': return '+16475551234';
      default: return '+911234567890';
    }
  }

  // Minimal E.164 conversion/validation without external deps
  const E164_REGEX = /^\+[1-9]\d{7,14}$/;
  const countryDialMap: Record<string, string> = {
    IN: '+91',
    US: '+1',
    GB: '+44',
    AE: '+971',
    SG: '+65',
    AU: '+61',
    CA: '+1',
  };

  function toE164(raw: string, c: string) {
    const input = (raw || '').replace(/\s|-/g, '').trim();
    if (!input) return null;
    if (input.startsWith('+')) {
      return E164_REGEX.test(input) ? input : null;
    }
    const dial = countryDialMap[c] || '';
    const digits = input.replace(/\D/g, '');
    const candidate = `${dial}${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  const startLoginMutation = useMutation(
    (payload: { phone: string; password: string }) => api.post('/auth/login-password', payload),
    {
      onSuccess: (response) => {
        const { pendingSessionId, code } = response.data as { pendingSessionId: string; code?: string };
        setPendingSessionId(pendingSessionId);
        setStep('otp');
        setPhone(payloadRef.current.phone);
        if (import.meta.env.VITE_NODE_ENV === 'development' && code) {
          setDevLoginOTPCode(code);
        } else {
          setDevLoginOTPCode('');
        }
        toast.success('OTP sent. Please enter the code.');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
      },
    }
  );

  // Keep the last payload phone so we can set state after mutation succeeds
  const payloadRef = { current: { phone: '' } } as { current: { phone: string } };

  const verifyOTPMutation = useMutation(
    (data: OTPFormData) => api.post('/auth/otp/verify-2fa', { pendingSessionId, code: data.code }),
    {
      onSuccess: (response) => {
        console.log('OTP verification successful:', response.data);
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        // Ensure subsequent API calls are authenticated without requiring a full reload
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);
        toast.success('Login successful!');
        // Role-based redirect
        if (user?.role === 'FARMER') {
          navigate('/farmer/dashboard', { replace: true });
        } else if (user?.role === 'ADMIN') {
          // Redirect admin users to the dedicated admin-portal
          window.location.href = 'http://localhost:5174/dashboard';
        } else {
          navigate('/home', { replace: true });
        }
      },
      onError: (error: any) => {
        console.error('OTP verification failed:', error);
        toast.error('Failed to verify OTP');
      },
    }
  );

  const onCredentialsSubmit = (data: CredentialsFormData) => {
    const e164 = toE164(data.phone, country);
    if (!e164) {
      toast.error('Login failed. Please check your credentials.');
      return;
    }
    const payload = { phone: e164, password: data.password };
    payloadRef.current.phone = e164;
    startLoginMutation.mutate(payload);
  };

  const onOTPSubmit = (data: OTPFormData) => {
    verifyOTPMutation.mutate(data);
  };

  const resendOTPMutation = useMutation(
    () => api.post('/auth/otp/request', { phone }),
    {
      onSuccess: () => {
        toast.success('OTP resent');
        setCooldown(30);
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0; }
            return c - 1;
          });
        }, 1000);
      },
      onError: (e: any) => { 
        console.error('Resend OTP error:', e);
        toast.error(e.response?.data?.error || 'Failed to resend OTP'); 
      },
    }
  );

  const handleForgotPasswordSuccess = () => {
    setStep('credentials');
    toast.success('Password reset successful!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login to Your Account</h1>
          {step !== 'forgot' && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                {step === 'credentials' ? 'Login' : 'Verify OTP'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {step === 'credentials' 
                  ? <p className="text-gray-600 mb-8">Enter your phone and password. We'll then send you an OTP.</p>
                  : 'Enter the OTP sent to your phone'
                }
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'credentials' && (
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="mt-1">
                  <div className="flex gap-2">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value as any)}
                      className="px-2 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    >
                      <option value="IN">India (+91)</option>
                      <option value="US">United States (+1)</option>
                      <option value="GB">United Kingdom (+44)</option>
                      <option value="AE">UAE (+971)</option>
                      <option value="SG">Singapore (+65)</option>
                      <option value="AU">Australia (+61)</option>
                      <option value="CA">Canada (+1)</option>
                    </select>
                    <input
                      {...credentialsForm.register('phone')}
                      type="tel"
                      placeholder={formatExampleForCountry(country)}
                      inputMode="tel"
                      autoComplete="tel"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {credentialsForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{credentialsForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="mt-1">
                  <input
                    {...credentialsForm.register('password')}
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {credentialsForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{credentialsForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" className="text-sm text-green-700 hover:underline" onClick={() => setStep('forgot')}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled={startLoginMutation.isLoading}>
                {credentialsForm.formState.isSubmitting ? 'Sending OTP...' : 'Sign in'}
              </button>

              <div className="text-center mt-4">
                <p className="text-center text-gray-600">Don't have an account? <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">Sign up here</Link></p>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 text-sm text-gray-600">
                  {phone}
                </div>
              </div>

              {import.meta.env.VITE_NODE_ENV === 'development' && devLoginOTPCode && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm">
                  Dev mode: OTP code is <span className="font-mono font-semibold">{devLoginOTPCode}</span>
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <div className="mt-1">
                  <input
                    {...otpForm.register('code', {
                      onChange: (e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        otpForm.setValue('code', onlyDigits, { shouldValidate: true, shouldDirty: true });
                      },
                    })}
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-lg tracking-widest"
                  />
                  {otpForm.formState.isSubmitted && otpForm.formState.errors.code && (
                    <p className="mt-1 text-sm text-red-600">
                      {otpForm.formState.errors.code.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                  onClick={() => setStep('credentials')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={verifyOTPMutation.isLoading || watchedOtpCode.length !== 6}
                >
                  {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="mt-3 text-sm text-green-700 hover:underline disabled:text-gray-400"
                  onClick={() => resendOTPMutation.mutate()}
                  disabled={cooldown > 0 || resendOTPMutation.isLoading}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'forgot' && (
            <ForgotPassword 
              onBack={() => setStep('credentials')}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
