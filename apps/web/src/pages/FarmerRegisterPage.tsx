import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Tractor, Leaf, Users, TrendingUp, Building } from 'lucide-react';

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
  businessName: z.string().min(2, 'Business name is required'),
  farmAddress: z.string().min(10, 'Please provide a detailed farm address'),
  farmType: z.enum(['VEGETABLES', 'FRUITS', 'GRAINS', 'DAIRY', 'ORGANIC', 'MIXED']),
  role: z.literal('FARMER'),
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

export default function FarmerRegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const { setUser } = useAuthStore();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<RegisterFormData>({ 
    resolver: zodResolver(registerSchema), 
    defaultValues: { role: 'FARMER', farmType: 'VEGETABLES' } 
  });
  const otpForm = useForm<OTPFormData>({ resolver: zodResolver(otpSchema) });

  const startRegisterMutation = useMutation(
    (data: { name: string; email?: string; phone?: string; password: string; role: 'FARMER'; businessName: string; farmAddress: string; farmType: string }) => 
      api.post('/auth/register-password', data),
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
        toast.success('Welcome to Agri-Connect! Your farmer account is ready.');
        window.location.href = '/farmer/profile';
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to verify OTP');
      }
    }
  );

  const onSubmit = (data: RegisterFormData) => {
    const payload: any = { 
      name: data.name, 
      password: data.password, 
      role: data.role,
      businessName: data.businessName,
      farmAddress: data.farmAddress,
      farmType: data.farmType
    };
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

  const farmTypeOptions = [
    { value: 'VEGETABLES', label: 'Vegetables', icon: '🥬' },
    { value: 'FRUITS', label: 'Fruits', icon: '🍎' },
    { value: 'GRAINS', label: 'Grains & Cereals', icon: '🌾' },
    { value: 'DAIRY', label: 'Dairy Products', icon: '🥛' },
    { value: 'ORGANIC', label: 'Organic Farming', icon: '🌱' },
    { value: 'MIXED', label: 'Mixed Farming', icon: '🚜' },
  ];

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
                  <h1 className="text-3xl font-bold tracking-tight">Join as a Farmer</h1>
                  <p className="text-amber-100 text-sm font-medium">Grow with Agri-Connect</p>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Start Your Journey!</h2>
              <p className="text-amber-50 text-lg leading-relaxed opacity-90">
                Start selling your produce directly to customers. Build your farming business with powerful tools.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Higher Profits</h3>
                  <p className="text-amber-100 text-sm opacity-90">Eliminate middlemen and sell directly to customers. Keep 100% of your profit margins.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Direct Customer Connection</h3>
                  <p className="text-amber-100 text-sm opacity-90">Build relationships with customers who appreciate fresh, local produce.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Business Growth Tools</h3>
                  <p className="text-amber-100 text-sm opacity-90">Access analytics, inventory management, and marketing tools to grow your business.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto max-h-screen">
          <div className="w-full max-w-lg mx-auto p-6 sm:p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center space-x-3 text-2xl font-bold text-amber-600 hover:text-amber-700 transition-colors">
                <Tractor className="h-8 w-8" />
                <span>Agri-Connect</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'form' ? 'Create Farmer Account' : 'Verify Your Email'}
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 'form' 
                  ? 'Join thousands of farmers growing their business with us'
                  : 'Enter the 6-digit code sent to your email or phone'
                }
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
            {step === 'form' ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-amber-600" />
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input 
                      {...form.register('name')} 
                      type="text" 
                      placeholder="Your full name" 
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.name && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input 
                      {...form.register('email')} 
                      type="email" 
                      placeholder="your.email@example.com" 
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.email && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>)}
                  </div>
                  
                  <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 text-gray-500 font-medium">OR</span>
                  </div>
                </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-28 flex-shrink-0 px-2 py-3 border-2 border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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
                        {...form.register('phone')} 
                        type="tel" 
                        placeholder="1234567890" 
                        autoComplete="tel"
                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter phone without country code</p>
                    {form.formState.errors.phone && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>)}
                  </div>
                </div>

                {/* Farm Information */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-amber-600" />
                    Farm Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business/Farm Name</label>
                    <input 
                      {...form.register('businessName')} 
                      type="text" 
                      placeholder="e.g., Green Valley Farms" 
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.businessName && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.businessName.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Address</label>
                    <textarea 
                      {...form.register('farmAddress')} 
                      placeholder="Complete farm address including village, district, state, and pincode" 
                      rows={3}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.farmAddress && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.farmAddress.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Type</label>
                    <select 
                      {...form.register('farmType')} 
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    >
                      {farmTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.farmType && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.farmType.message}</p>)}
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Security</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input 
                      {...form.register('password')} 
                      type="password" 
                      autoComplete="new-password" 
                      placeholder="Create a strong password" 
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.password && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>)}
                    {!form.formState.errors.password && form.watch('password') && (
                      <p className="mt-1 text-xs text-gray-500">Use 8+ chars with upper, lower, number and special character.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <input 
                      {...form.register('confirmPassword')} 
                      type="password" 
                      autoComplete="new-password" 
                      placeholder="Re-enter password" 
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                    />
                    {form.formState.errors.confirmPassword && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>)}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5" 
                  disabled={startRegisterMutation.isLoading}
                >
                  {startRegisterMutation.isLoading ? 'Creating Account...' : 'Create Farmer Account'}
                </button>

                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have a farmer account?{' '}
                      <Link to="/farmer-login" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-all">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Customer?{' '}
                      <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all">
                        Create customer account
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{email ? 'Email Address' : 'Phone Number'}</label>
                  <div className="mt-1 text-sm text-gray-600">{email || phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                  <input 
                    {...otpForm.register('code')} 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6} 
                    className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center text-2xl tracking-[0.5em] font-bold transition-all" 
                  />
                  {otpForm.formState.errors.code && (<p className="mt-1 text-sm text-red-600">{otpForm.formState.errors.code.message}</p>)}
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5" 
                    disabled={verifyOTPMutation.isLoading}
                  >
                    {verifyOTPMutation.isLoading ? 'Verifying...' : 'Complete Registration'}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
