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
  email: z.string().optional().refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
    message: 'Enter a valid email address'
  }),
  phone: z.string().optional().refine((val) => !val || val === '' || val.length >= 5, {
    message: 'Enter a valid phone number'
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.email || data.phone, {
  message: 'Please provide either email or phone number',
  path: ['email'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function FarmerLoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot'>('credentials');
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
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

  const startLoginMutation = useMutation(
    (payload: { email?: string; phone?: string; password: string }) => api.post('/auth/login-password', payload),
    {
      onSuccess: (response) => {
        const { pendingSessionId, code } = response.data as { pendingSessionId: string; code?: string };
        setPendingSessionId(pendingSessionId);
        setStep('otp');
        setEmail(payloadRef.current.email);
        setPhone(payloadRef.current.phone);
        if (import.meta.env.VITE_NODE_ENV === 'development' && code) {
          setDevLoginOTPCode(code);
        } else {
          setDevLoginOTPCode('');
        }
        const target = payloadRef.current.email ? 'email' : 'phone';
        toast.success(`OTP sent to your ${target}. Please check your inbox.`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Login failed');
      },
    }
  );

  // Keep the last payload email/phone so we can set state after mutation succeeds
  const payloadRef = { current: { email: '', phone: '' } } as { current: { email: string; phone: string } };

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
    const payload: any = { password: data.password };
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = countryCode + data.phone;
    payloadRef.current.email = data.email || '';
    payloadRef.current.phone = data.phone ? countryCode + data.phone : '';
    startLoginMutation.mutate(payload);
  };

  const onOTPSubmit = (data: OTPFormData) => {
    verifyOTPMutation.mutate(data);
  };

  const resendOTPMutation = useMutation(
    () => api.post('/auth/otp/request', email ? { email } : { phone }),
    {
      onSuccess: () => {
        const target = email ? 'email' : 'phone';
        toast.success(`OTP resent to your ${target}`);
        setCooldown(30);
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0; };
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side - Farmer Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 p-12 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 flex flex-col justify-center h-full text-white">
            {/* Logo Section */}
            <div className="mb-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                  <Tractor className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Farmer Portal</h1>
                  <p className="text-amber-100 text-sm font-medium">Grow with Agri-Connect</p>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Welcome Back, Farmer!</h2>
              <p className="text-amber-50 text-lg leading-relaxed opacity-90">
                Access your dashboard and manage your farming business with powerful tools.
              </p>
            </div>
            
            {/* Benefits List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Direct Sales</h3>
                  <p className="text-amber-100 text-sm opacity-90">Sell directly to customers without middlemen. Keep more profit from your hard work.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Build Relationships</h3>
                  <p className="text-amber-100 text-sm opacity-90">Connect with customers who value fresh, local produce and build lasting relationships.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Grow Your Business</h3>
                  <p className="text-amber-100 text-sm opacity-90">Access analytics, manage inventory, and scale your farming business with our tools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-3 text-2xl font-bold text-amber-600 hover:text-amber-700 transition-colors">
                <Tractor className="h-8 w-8" />
                <span>Agri-Connect</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              {step !== 'forgot' && (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 'credentials' ? 'Farmer Login' : 'Verify OTP'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {step === 'credentials' 
                      ? 'Access your farmer dashboard and manage your business'
                      : 'Enter the 6-digit code sent to your email or phone'
                    }
                  </p>
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm">
            {step === 'credentials' && (
              <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} noValidate className="space-y-6">
                {useEmail ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                      <button
                        type="button"
                        onClick={() => {
                          setUseEmail(false);
                          credentialsForm.setValue('email', '');
                          credentialsForm.clearErrors('email');
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Use Phone Number
                      </button>
                    </div>
                    <input
                      {...credentialsForm.register('email')}
                      type="email"
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                    {credentialsForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{credentialsForm.formState.errors.email.message}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                      <button
                        type="button"
                        onClick={() => {
                          setUseEmail(true);
                          credentialsForm.setValue('phone', '');
                          credentialsForm.clearErrors('phone');
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Use Email-ID
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-32 px-3 py-3 border-2 border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      >
                        <option value="+91">🇮🇳 India (+91)</option>
                        <option value="+1">🇺🇸 USA (+1)</option>
                        <option value="+44">🇬🇧 UK (+44)</option>
                        <option value="+971">🇦🇪 UAE (+971)</option>
                        <option value="+65">🇸🇬 Singapore (+65)</option>
                        <option value="+61">🇦🇺 Australia (+61)</option>
                        <option value="+86">🇨🇳 China (+86)</option>
                        <option value="+81">🇯🇵 Japan (+81)</option>
                        <option value="+82">🇰🇷 S. Korea (+82)</option>
                        <option value="+49">🇩🇪 Germany (+49)</option>
                        <option value="+33">🇫🇷 France (+33)</option>
                        <option value="+39">🇮🇹 Italy (+39)</option>
                        <option value="+34">🇪🇸 Spain (+34)</option>
                        <option value="+7">🇷🇺 Russia (+7)</option>
                        <option value="+55">🇧🇷 Brazil (+55)</option>
                        <option value="+27">🇿🇦 S. Africa (+27)</option>
                        <option value="+234">🇳🇬 Nigeria (+234)</option>
                        <option value="+20">🇪🇬 Egypt (+20)</option>
                      </select>
                      <input
                        {...credentialsForm.register('phone')}
                        type="tel"
                        placeholder="1234567890"
                        autoComplete="tel"
                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter phone without country code</p>
                    {credentialsForm.formState.errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{credentialsForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div>
                    <input
                      {...credentialsForm.register('password')}
                      type="password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                    {credentialsForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">{credentialsForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button type="button" className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline transition-all" onClick={() => setStep('forgot')}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5" disabled={startLoginMutation.isLoading}>
                  {startLoginMutation.isLoading ? 'Sending OTP...' : 'Continue to Dashboard'}
                </button>
                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      New farmer?{' '}
                      <Link to="/farmer-register" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-all">
                        Join Agri-Connect
                      </Link>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Customer?{' '}
                      <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all">
                        Use customer login
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} noValidate className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {email ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="mt-1 text-sm text-gray-600">
                    {email || phone}
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
                      className="appearance-none block w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center text-2xl tracking-[0.5em] font-bold transition-all"
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
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all"
                    onClick={() => setStep('credentials')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    disabled={verifyOTPMutation.isLoading || watchedOtpCode.length !== 6}
                  >
                    {verifyOTPMutation.isLoading ? 'Verifying...' : 'Access Dashboard'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline disabled:text-gray-400 disabled:no-underline transition-all"
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
    </div>
  );
}
