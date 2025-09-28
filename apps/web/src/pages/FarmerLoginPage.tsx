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
import { Tractor, Leaf, Users, TrendingUp } from 'lucide-react';

const credentialsSchema = z.object({
  phone: z.string().min(5, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function FarmerLoginPage() {
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
        toast.error(error.response?.data?.error || 'Login failed');
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
        
        // Verify the user is actually a farmer
        if (user?.role !== 'FARMER') {
          toast.error('This login is for farmers only. Please use the regular login page.');
          return;
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        // Ensure subsequent API calls are authenticated without requiring a full reload
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);
        toast.success('Welcome back, farmer!');
        navigate('/farmer/dashboard', { replace: true });
      },
      onError: (error: any) => {
        console.error('OTP verification failed:', error);
        toast.error(error.response?.data?.error || 'Failed to verify OTP');
      },
    }
  );

  const onCredentialsSubmit = (data: CredentialsFormData) => {
    const e164 = toE164(data.phone, country);
    if (!e164) {
      toast.error('Please enter a valid phone number');
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
    toast.success('You can now login with your new password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex">
      {/* Left Side - Farmer Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 text-white">
        <div className="flex flex-col justify-center max-w-md mx-auto">
          <div className="text-center mb-8">
            <Tractor className="h-16 w-16 mx-auto mb-4 text-green-200" />
            <h1 className="text-3xl font-bold mb-2">Farmer Portal</h1>
            <p className="text-green-100">Grow your business with Agri-Connect</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Direct Sales</h3>
                <p className="text-green-100 text-sm">Sell directly to customers without middlemen. Keep more profit from your hard work.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Build Relationships</h3>
                <p className="text-green-100 text-sm">Connect with customers who value fresh, local produce and build lasting relationships.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Grow Your Business</h3>
                <p className="text-green-100 text-sm">Access analytics, manage inventory, and scale your farming business with our tools.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-bold text-green-600 hover:text-green-700">
              Agri-Connect
            </Link>
            {step !== 'forgot' && (
              <>
                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                  {step === 'credentials' ? 'Farmer Login' : 'Verify OTP'}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {step === 'credentials' 
                    ? 'Access your farmer dashboard and manage your business'
                    : 'Enter the 6-digit code sent to your phone.'
                  }
                </p>
              </>
            )}
          </div>

          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200">
            {step === 'credentials' && (
              <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} noValidate className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1">
                    <div className="flex gap-2">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value as any)}
                        className="px-2 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-green-500 focus:border-green-500"
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
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
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
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={startLoginMutation.isLoading}>
                  {startLoginMutation.isLoading ? 'Sending OTP...' : 'Continue to Dashboard'}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    New farmer?{' '}
                    <Link to="/farmer-register" className="font-medium text-green-600 hover:text-green-500">
                      Join Agri-Connect
                    </Link>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Customer?{' '}
                    <Link to="/login" className="text-green-600 hover:text-green-500">
                      Use customer login
                    </Link>
                  </p>
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
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
                    onClick={() => setStep('credentials')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={verifyOTPMutation.isLoading || watchedOtpCode.length !== 6}
                  >
                    {verifyOTPMutation.isLoading ? 'Verifying...' : 'Access Dashboard'}
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
    </div>
  );
}
