import { useAuthStore } from '../stores/authStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import Button from '../components/ui/Button';

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().nullish().transform(v => v ?? undefined),
  address: z.string().nullish().transform(v => v ?? undefined),
  businessName: z.string().optional(),
  description: z.string().optional(),
  farmerAddress: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser, clearUser } = useAuthStore();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name,
      email: user?.email,
      address: typeof user?.address === 'string' ? user?.address : undefined,
      businessName: user?.farmerProfile?.businessName,
      description: undefined,
      farmerAddress: undefined,
    }
  });

  const mutation = useMutation(
    (data: FormData) => api.patch('/users/me', {
      name: data.name,
      email: data.email,
      address: data.address,
      farmerProfile: user?.role === 'FARMER' ? {
        businessName: data.businessName,
        description: data.description,
        address: data.farmerAddress,
      } : undefined,
    }),
    {
      onSuccess: async (res) => {
        toast.success('Profile updated');
        // Refresh user data from /auth/me
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Don't clear user on refresh failure, just use the update response
          if (res.data?.user) {
            setUser({ ...user, ...res.data.user, farmerProfile: res.data.farmerProfile || user?.farmerProfile });
          }
        }
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to update profile'); }
    }
  );

  const deleteMutation = useMutation(
    () => api.delete('/users/me'),
    {
      onSuccess: () => {
        toast.success('Account deleted');
        // clear auth
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        clearUser();
        window.location.href = '/login';
      },
      onError: (e: any) => { toast.error(e.response?.data?.error || 'Failed to delete account'); }
    }
  );

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">{user?.name}</div>
            <div className="text-gray-600 capitalize">{user?.role?.toLowerCase()}</div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input {...form.register('name')} className="mt-1 w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" {...form.register('email')} className="mt-1 w-full border rounded-md px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea {...form.register('address')} className="mt-1 w-full border rounded-md px-3 py-2" rows={2} />
            </div>
          </div>

          {user?.role === 'FARMER' && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Farmer Profile</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input {...form.register('businessName')} className="mt-1 w-full border rounded-md px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea {...form.register('description')} className="mt-1 w-full border rounded-md px-3 py-2" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Farm Address</label>
                  <textarea {...form.register('farmerAddress')} className="mt-1 w-full border rounded-md px-3 py-2" rows={2} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                if (deleteMutation.isLoading) return;
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  deleteMutation.mutate();
                }
              }}
              className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Deleting…' : 'Delete Account'}
            </button>

            <Button type="submit" loading={mutation.isLoading}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
