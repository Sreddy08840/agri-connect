import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { initializeGoogleSignIn, handleGoogleSignIn } from '../lib/googleAuth';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[a-z]/, 'Must include at least one lowercase letter')
  .regex(/[0-9]/, 'Must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must include at least one special character');

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  phone: z.string().min(5, 'Enter a valid phone number').optional().or(z.literal('')),
  password: strongPassword,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.email || data.phone, {
  message: 'Please provide either email or phone number',
  path: ['email'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [useEmail, setUseEmail] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const { setUser } = useAuthStore();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });
  const otpForm = useForm<OTPFormData>({ resolver: zodResolver(otpSchema) });

  const startRegisterMutation = useMutation(
    (data: { name: string; email?: string; phone?: string; password: string; role: 'CUSTOMER' }) => api.post('/auth/register-password', data),
    {
      onSuccess: (response) => {
        const { pendingSessionId } = response.data as { pendingSessionId: string };
        setPendingSessionId(pendingSessionId);
        setEmail(payloadRef.current.email);
        setPhone(payloadRef.current.phone);
        setStep('otp');
        const target = payloadRef.current.email ? 'email' : 'phone';
        toast.success(`OTP sent to your ${target}. Please check your inbox.`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Registration failed');
      },
    }
  );

  const payloadRef = { current: { email: '', phone: '' } } as { current: { email: string; phone: string } };

  const verifyOTPMutation = useMutation(
    (data: OTPFormData) => api.post('/auth/otp/verify-2fa', { pendingSessionId, code: data.code }),
    {
      onSuccess: (response) => {
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        toast.success('Welcome! Your account is ready.');
        if (user?.role === 'FARMER') {
          window.location.href = '/farmer';
        } else if (user?.role === 'ADMIN') {
          // Redirect admin users to the dedicated admin-portal
          window.location.href = 'http://localhost:5174/dashboard';
        } else {
          window.location.href = '/home';
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to verify OTP');
      }
    }
  );

  const onSubmit = (data: RegisterFormData) => {
    const payload: any = { name: data.name, password: data.password, role: 'CUSTOMER' };
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = countryCode + data.phone;
    payloadRef.current.email = data.email || '';
    payloadRef.current.phone = data.phone ? countryCode + data.phone : '';
    startRegisterMutation.mutate(payload);
  };
  const onOTPSubmit = (data: OTPFormData) => verifyOTPMutation.mutate(data);

  const resendOTPMutation = useMutation(
    () => api.post('/auth/otp/request', email ? { email } : { phone }),
    {
      onSuccess: () => {
        const target = email ? 'email' : 'phone';
        toast.success(`OTP resent to your ${target}`);
        setCooldown(30);
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0; }
            return c - 1;
          });
        }, 1000);
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to resend OTP'); },
    }
  );

  const handleGoogleSignUp = async (response: any) => {
    try {
      const result = await handleGoogleSignIn(response.credential);
      if (result.success) {
        setUser(result.user);
        toast.success('Google sign-up successful!');
        if (result.user?.role === 'FARMER') {
          window.location.href = '/farmer';
        } else if (result.user?.role === 'ADMIN') {
          window.location.href = 'http://localhost:5174/dashboard';
        } else {
          window.location.href = '/home';
        }
      } else {
        toast.error(result.error || 'Google sign-up failed');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      toast.error('Google sign-up failed');
    }
  };

  useEffect(() => {
    if (step === 'form') {
      const timer = setTimeout(() => {
        initializeGoogleSignIn(handleGoogleSignUp, (error) => {
          console.log('Google Sign-Up prompt error:', error);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side - Customer Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-12 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="relative z-10 flex flex-col justify-center h-full text-white">
            {/* Logo Section */}
            <div className="mb-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                  <span className="text-4xl">🛒</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Join Agri-Connect</h1>
                  <p className="text-emerald-100 text-sm font-medium">Customer Portal</p>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Shop Fresh, Shop Local!</h2>
              <p className="text-emerald-50 text-lg leading-relaxed opacity-90">
                Discover fresh produce directly from local farmers. Support sustainable agriculture and enjoy the best quality.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🥬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Farm Fresh Quality</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Handpicked produce delivered at peak freshness</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fast Delivery</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Quick and reliable delivery to your doorstep</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fair Prices</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Transparent pricing that supports local farmers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-3 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors">
                <span className="text-3xl">🛒</span>
                <span>Agri-Connect</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              {step !== 'otp' && (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Customer Account
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Join thousands of customers enjoying fresh, local produce
                  </p>
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm">
            {step === 'form' && (
              <>
                {/* Google Sign-In Button */}
                <div className="w-full mb-6">
                  <div id="google-signin-button" className="w-full"></div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 text-gray-500 font-medium">or create account with email</span>
                  </div>
                </div>
              </>
            )}

            {step === 'form' ? (
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    {...form.register('name')}
                    type="text"
                    placeholder="Enter your full name"
                    className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {useEmail ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                      <button
                        type="button"
                        onClick={() => setUseEmail(false)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Use Phone Number
                      </button>
                    </div>
                    <input
                      {...form.register('email')}
                      type="email"
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                      <button
                        type="button"
                        onClick={() => setUseEmail(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Use Email-ID
                      </button>
                    </div>
                    <div className="relative">
                      <div className="flex items-center border-2 border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="px-3 py-3 bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+65">🇸🇬 +65</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+86">🇨🇳 +86</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+82">🇰🇷 +82</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+39">🇮🇹 +39</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+7">🇷🇺 +7</option>
                          <option value="+55">🇧🇷 +55</option>
                          <option value="+27">🇿🇦 +27</option>
                          <option value="+234">🇳🇬 +234</option>
                          <option value="+20">🇪🇬 +20</option>
                        </select>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <input
                          {...form.register('phone')}
                          type="tel"
                          placeholder="1234567890"
                          autoComplete="tel"
                          className="flex-1 px-4 py-3 bg-transparent border-none outline-none placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter phone without country code</p>
                    {form.formState.errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    {...form.register('password')}
                    type="password"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                  {!form.formState.errors.password && form.watch('password') && (
                    <p className="mt-1 text-xs text-gray-500">Use 8+ chars with upper, lower, number and special character.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    {...form.register('confirmPassword')}
                    type="password"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button type="submit" className="w-full px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5" disabled={startRegisterMutation.isLoading}>
                  {startRegisterMutation.isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Want to sell products?{' '}
                      <Link to="/farmer-register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-all">
                        Join as Farmer
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} noValidate className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {email ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="mt-1 text-sm text-gray-600">
                    {email || phone}
                  </div>
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    {...otpForm.register('code', {
                      onChange: (e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        otpForm.setValue('code', onlyDigits, { shouldValidate: true, shouldDirty: true });
                      },
                    })}
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    className="appearance-none block w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-[0.5em] font-bold transition-all"
                  />
                  {otpForm.formState.isSubmitted && otpForm.formState.errors.code && (
                    <p className="mt-1 text-sm text-red-600">
                      {otpForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all"
                    onClick={() => setStep('form')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    disabled={verifyOTPMutation.isLoading || (otpForm.watch('code') || '').length !== 6}
                  >
                    {verifyOTPMutation.isLoading ? 'Verifying...' : 'Verify & Complete'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="mt-4 text-sm font-medium text-green-600 hover:text-green-700 hover:underline disabled:text-gray-400 disabled:no-underline transition-all"
                    onClick={() => resendOTPMutation.mutate()}
                    disabled={cooldown > 0 || resendOTPMutation.isLoading}
                  >
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
