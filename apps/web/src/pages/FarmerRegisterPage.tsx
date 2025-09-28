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
  phone: z.string().min(5, 'Enter a valid phone number'),
  password: strongPassword,
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  farmAddress: z.string().min(10, 'Please provide a detailed farm address'),
  farmType: z.enum(['VEGETABLES', 'FRUITS', 'GRAINS', 'DAIRY', 'ORGANIC', 'MIXED']),
  role: z.literal('FARMER'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function FarmerRegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<'IN' | 'US' | 'GB' | 'AE' | 'SG' | 'AU' | 'CA'>('IN');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const { setUser } = useAuthStore();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<RegisterFormData>({ 
    resolver: zodResolver(registerSchema), 
    defaultValues: { role: 'FARMER', farmType: 'VEGETABLES' } 
  });
  const otpForm = useForm<OTPFormData>({ resolver: zodResolver(otpSchema) });

  // Minimal E.164 formatting helpers
  const E164_REGEX = /^\+[1-9]\d{7,14}$/;
  const countryDialMap: Record<string, string> = {
    IN: '+91', US: '+1', GB: '+44', AE: '+971', SG: '+65', AU: '+61', CA: '+1',
  };
  function toE164(raw: string, c: string) {
    const input = (raw || '').replace(/\s|-/g, '').trim();
    if (!input) return null;
    if (input.startsWith('+')) return E164_REGEX.test(input) ? input : null;
    const dial = countryDialMap[c] || '';
    const digits = input.replace(/\D/g, '');
    const candidate = `${dial}${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  const startRegisterMutation = useMutation(
    (data: { name: string; phone: string; password: string; role: 'FARMER'; businessName: string; farmAddress: string; farmType: string }) => 
      api.post('/auth/register-password', data),
    {
      onSuccess: (response) => {
        const { pendingSessionId } = response.data as { pendingSessionId: string };
        setPendingSessionId(pendingSessionId);
        setPhone(payloadRef.current.phone);
        setStep('otp');
        toast.success('OTP sent. Please enter the code to complete your farmer registration.');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Registration failed');
      },
    }
  );

  const payloadRef = { current: { phone: '' } } as { current: { phone: string } };

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
    const e164 = toE164(data.phone, country);
    if (!e164) {
      toast.error('Please enter a valid phone number');
      return;
    }
    const payload = { 
      name: data.name, 
      phone: e164, 
      password: data.password, 
      role: data.role,
      businessName: data.businessName,
      farmAddress: data.farmAddress,
      farmType: data.farmType
    };
    payloadRef.current.phone = e164;
    startRegisterMutation.mutate(payload);
  };
  const onOTPSubmit = (data: OTPFormData) => verifyOTPMutation.mutate(data);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex">
      {/* Left Side - Farmer Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 text-white">
        <div className="flex flex-col justify-center max-w-md mx-auto">
          <div className="text-center mb-8">
            <Tractor className="h-16 w-16 mx-auto mb-4 text-green-200" />
            <h1 className="text-3xl font-bold mb-2">Join as a Farmer</h1>
            <p className="text-green-100">Start selling your produce directly to customers</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Higher Profits</h3>
                <p className="text-green-100 text-sm">Eliminate middlemen and sell directly to customers. Keep 100% of your profit margins.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Direct Customer Connection</h3>
                <p className="text-green-100 text-sm">Build relationships with customers who appreciate fresh, local produce.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Growth Tools</h3>
                <p className="text-green-100 text-sm">Access analytics, inventory management, and marketing tools to grow your business.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-bold text-green-600 hover:text-green-700">
              Agri-Connect
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {step === 'form' ? 'Create Farmer Account' : 'Verify Your Phone'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'form' 
                ? 'Join thousands of farmers growing their business with us'
                : 'Enter the 6-digit code sent to your phone.'
              }
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200">
            {step === 'form' ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input 
                      {...form.register('name')} 
                      type="text" 
                      placeholder="Your full name" 
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                    />
                    {form.formState.errors.name && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 flex gap-2">
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
                        {...form.register('phone')} 
                        type="tel" 
                        placeholder="Enter phone number" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                      />
                    </div>
                    {form.formState.errors.phone && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>)}
                  </div>
                </div>

                {/* Farm Information */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-green-600" />
                    Farm Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business/Farm Name</label>
                    <input 
                      {...form.register('businessName')} 
                      type="text" 
                      placeholder="e.g., Green Valley Farms" 
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                    />
                    {form.formState.errors.businessName && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.businessName.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Address</label>
                    <textarea 
                      {...form.register('farmAddress')} 
                      placeholder="Complete farm address including village, district, state, and pincode" 
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                    />
                    {form.formState.errors.farmAddress && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.farmAddress.message}</p>)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Type</label>
                    <select 
                      {...form.register('farmType')} 
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input 
                      {...form.register('password')} 
                      type="password" 
                      autoComplete="new-password" 
                      placeholder="Create a strong password" 
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                    />
                    {form.formState.errors.password && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>)}
                    {!form.formState.errors.password && form.watch('password') && (
                      <p className="mt-1 text-xs text-gray-500">Use 8+ chars with upper, lower, number and special character.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input 
                      {...form.register('confirmPassword')} 
                      type="password" 
                      autoComplete="new-password" 
                      placeholder="Re-enter password" 
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" 
                    />
                    {form.formState.errors.confirmPassword && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>)}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 transition-colors" 
                  disabled={startRegisterMutation.isLoading}
                >
                  {startRegisterMutation.isLoading ? 'Creating Account...' : 'Create Farmer Account'}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have a farmer account?{' '}
                    <Link to="/farmer-login" className="font-medium text-green-600 hover:text-green-500">
                      Sign in here
                    </Link>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Customer?{' '}
                    <Link to="/register" className="text-green-600 hover:text-green-500">
                      Create customer account
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1 text-sm text-gray-600">{phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                  <input 
                    {...otpForm.register('code')} 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6} 
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-lg tracking-widest" 
                  />
                  {otpForm.formState.errors.code && (<p className="mt-1 text-sm text-red-600">{otpForm.formState.errors.code.message}</p>)}
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors" 
                    onClick={() => setStep('form')}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 transition-colors" 
                    disabled={verifyOTPMutation.isLoading}
                  >
                    {verifyOTPMutation.isLoading ? 'Verifying...' : 'Complete Registration'}
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
          </div>
        </div>
      </div>
    </div>
  );
}
