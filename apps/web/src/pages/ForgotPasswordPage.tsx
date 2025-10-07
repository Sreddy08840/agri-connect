import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Phone, ArrowLeft, Send, CheckCircle, Shield, Lock, MessageSquare } from 'lucide-react';

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await api.post('/users/forgot-password', data);
      setIsSubmitted(true);

      // In development, show the reset URL
      if (response.data.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }

      toast.success('Reset instructions sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset instructions');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-farmer-beige-50 via-white to-farmer-green-50 flex">
        {/* Left Side - Success Message */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-center max-w-lg mx-auto text-white">
            <div className="mb-12">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Instructions Sent!</h1>
                  <p className="text-green-100 text-sm">Check your messages</p>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">You're All Set</h2>
              <p className="text-green-100 text-lg leading-relaxed">
                We've sent password reset instructions to your email or phone. The link will expire in 1 hour for security.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Check Your Messages</h3>
                  <p className="text-green-100 text-sm">Look for an SMS with reset instructions</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure Reset</h3>
                  <p className="text-green-100 text-sm">Your reset link is encrypted and expires in 1 hour</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Account Security</h3>
                  <p className="text-green-100 text-sm">We'll never ask for your password or share your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Content */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-farmer-green-600 hover:text-farmer-green-700 mb-6">
                <span className="text-3xl">🛒</span>
                <span>Agri-Connect</span>
              </Link>

              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Check Your Messages
              </h2>
              <p className="text-gray-600">
                If an account exists, we've sent password reset instructions to your email or phone.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">SMS Sent</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Reset instructions have been sent to your email or phone
                  </p>
                </div>

                <div className="text-gray-600">
                  <p className="mb-2">The reset link will expire in 1 hour for security reasons.</p>
                  <p className="text-sm">Didn't receive the message? Check your spam folder or try again.</p>
                </div>

                {resetUrl && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Development Mode - Reset Link:
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded font-mono break-all border">
                        {resetUrl}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(resetUrl);
                          toast.success('Link copied to clipboard');
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      In production, this link would be sent via SMS.
                    </p>
                  </div>
                )}

                <div className="pt-6 space-y-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 bg-farmer-green-600 text-white font-semibold rounded-xl hover:bg-farmer-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>

                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      form.reset();
                    }}
                    className="block w-full text-sm text-gray-600 hover:text-farmer-green-600 transition-colors"
                  >
                    Try different email or phone
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-farmer-beige-50 via-white to-farmer-green-50 flex">
      {/* Left Side - Forgot Password Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center max-w-lg mx-auto text-white">
          <div className="mb-12">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Forgot Password?</h1>
                <p className="text-blue-100 text-sm">No worries, we got you covered</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Reset Your Password</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Enter your email or phone number to receive password reset instructions.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Quick & Easy</h3>
                <p className="text-blue-100 text-sm">Enter your email or phone and we'll send reset instructions</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Process</h3>
                <p className="text-blue-100 text-sm">Your reset link is encrypted and expires in 1 hour</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Fast Recovery</h3>
                <p className="text-blue-100 text-sm">Get back to shopping fresh produce in minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-farmer-green-600 hover:text-farmer-green-700 mb-6">
              <span className="text-3xl">🛒</span>
              <span>Agri-Connect</span>
            </Link>

            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Forgot Your Password?
            </h2>
            <p className="text-gray-600">
              Enter your email or phone number and we'll send you reset instructions.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...form.register('identifier')}
                    className="appearance-none block w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your email or phone number"
                  />
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {form.formState.errors.identifier && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.identifier.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Sending Instructions...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 inline" />
                    Send Reset Instructions
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-farmer-green-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-farmer-green-600 hover:text-farmer-green-700">
                    Create one here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
