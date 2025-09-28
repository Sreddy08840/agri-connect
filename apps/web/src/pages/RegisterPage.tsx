import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

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
  role: z.enum(['CUSTOMER', 'FARMER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<'IN' | 'US' | 'GB' | 'AE' | 'SG' | 'AU' | 'CA'>('IN');
  const [pendingSessionId, setPendingSessionId] = useState('');
  const { setUser } = useAuthStore();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'CUSTOMER' } });
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
    (data: { name: string; phone: string; password: string; role: 'CUSTOMER' | 'FARMER' }) => api.post('/auth/register-password', data),
    {
      onSuccess: (response) => {
        const { pendingSessionId } = response.data as { pendingSessionId: string };
        setPendingSessionId(pendingSessionId);
        setPhone(payloadRef.current.phone);
        setStep('otp');
        toast.success('OTP sent. Please enter the code.');
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
    const e164 = toE164(data.phone, country);
    if (!e164) {
      toast.error('Please enter a valid phone number');
      return;
    }
    const payload = { name: data.name, phone: e164, password: data.password, role: data.role };
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-2">Create your account</h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            {step === 'form' ? 'Register with phone & password' : 'Verify OTP'}
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'form' ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input {...form.register('name')} type="text" placeholder="Your name" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                {form.formState.errors.name && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 flex gap-2">
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
                  <input {...form.register('phone')} type="tel" placeholder="Enter phone" className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                </div>
                {form.formState.errors.phone && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input {...form.register('password')} type="password" autoComplete="new-password" placeholder="Create a strong password" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                {form.formState.errors.password && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>)}
                {!form.formState.errors.password && form.watch('password') && (
                  <p className="mt-1 text-xs text-gray-500">Use 8+ chars with upper, lower, number and special character.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input {...form.register('confirmPassword')} type="password" autoComplete="new-password" placeholder="Re-enter password" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                {form.formState.errors.confirmPassword && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">I am a</label>
                <select {...form.register('role')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                  <option value="CUSTOMER">Customer</option>
                  <option value="FARMER">Farmer</option>
                </select>
                {form.formState.errors.role && (<p className="mt-1 text-sm text-red-600">{form.formState.errors.role.message}</p>)}
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50" disabled={startRegisterMutation.isLoading}>
                {startRegisterMutation.isLoading ? 'Sending OTP...' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 text-sm text-gray-600">{phone}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                <input {...otpForm.register('code')} type="text" placeholder="123456" maxLength={6} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-lg tracking-widest" />
                {otpForm.formState.errors.code && (<p className="mt-1 text-sm text-red-600">{otpForm.formState.errors.code.message}</p>)}
              </div>
              <div className="flex space-x-3">
                <button type="button" className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold" onClick={() => setStep('form')}>
                  Back
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50" disabled={verifyOTPMutation.isLoading}>
                  {verifyOTPMutation.isLoading ? 'Verifying...' : 'Verify OTP'}
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
  );
}
