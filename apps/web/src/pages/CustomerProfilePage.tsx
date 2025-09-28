import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingCart, 
  CreditCard, 
  Star, 
  Bell, 
  Settings, 
  HelpCircle, 
  Shield,
  Package,
  Edit2,
  Plus,
  Trash2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorSetup from '../components/TwoFactorSetup';
import EmailVerification from '../components/EmailVerification';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function CustomerProfilePage() {
  const { user, setUser, clearUser } = useAuthStore();
  const { items: cartItems, getTotalPrice, getTotalItems } = useCartStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      address: typeof user?.address === 'string' ? user?.address : '',
      phone: user?.phone || '',
    }
  });

  // Profile update mutation
  const updateProfileMutation = useMutation(
    (data: ProfileFormData) => api.patch('/users/me', data),
    {
      onSuccess: (res) => {
        toast.success('Profile updated successfully');
        setUser(res.data);
        setIsEditing(false);
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    () => api.delete('/users/me'),
    {
      onSuccess: () => {
        toast.success('Account deleted successfully');
        clearUser();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to delete account');
      }
    }
  );

  // Fetch orders - use the correct endpoint
  const { data: ordersResponse, isLoading: ordersLoading, error: ordersError } = useQuery(
    'customer-orders',
    () => api.get('/orders').then(res => res.data),
    { 
      enabled: !!user,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch orders:', error);
      }
    }
  );

  const orders = ordersResponse?.orders || [];

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'cart', label: 'Current Cart', icon: ShoppingCart },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const renderPersonalInfo = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="flex items-center space-x-6 mb-6">
        <ProfilePhotoUpload currentAvatarUrl={user?.avatarUrl} size="large" />
        <div>
          <div className="text-2xl font-semibold text-gray-900">{user?.name}</div>
          <div className="text-gray-600 capitalize">{user?.role?.toLowerCase()}</div>
          <div className="text-sm text-gray-500">Customer Account</div>
          {user?.verified && (
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-600">Verified Account</span>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                {...form.register('name')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email" 
                {...form.register('email')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input 
                {...form.register('phone')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
              <textarea 
                {...form.register('address')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                rows={3}
                placeholder="Enter your complete delivery address"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateProfileMutation.isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Full Name</div>
                <div className="font-medium">{user?.name || 'Not provided'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Email Address</div>
                <div className="font-medium">{user?.email || 'Not provided'}</div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Phone Number</div>
                <div className="font-medium">{user?.phone || 'Not provided'}</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500">Delivery Address</div>
                <div className="font-medium">{user?.address || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrderHistory = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
      
      {ordersLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
      ) : ordersError ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-red-300 mx-auto mb-4" />
          <p className="text-red-500">Failed to load orders</p>
          <p className="text-sm text-gray-400">Please try refreshing the page</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400">Start shopping to see your orders here</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/products'}
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">Order #{order.id.slice(-8)}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    From {order.farmer?.businessName || order.farmer?.user?.name || 'Farmer'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{order.total?.toFixed(2)}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'PLACED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {order.items?.length || 0} items
              </div>
              <IconButton 
                variant="outline" 
                size="sm"
                icon={<Eye className="h-4 w-4" />}
                tooltip="View order details"
                onClick={() => window.location.href = `/orders/${order.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCurrentCart = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Cart</h2>
      {!cartItems || cartItems.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400">Add some products to get started</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/products'}
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="h-full w-full object-cover rounded"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    Quantity: {item.qty} {item.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    From {item.farmerName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{(item.price * item.qty).toFixed(2)}</div>
                <div className="text-sm text-gray-500">₹{item.price} each</div>
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total ({getTotalItems()} items)</span>
              <span>₹{getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/cart'}
              >
                View Cart
              </Button>
              <Button 
                onClick={() => window.location.href = '/checkout'}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'orders':
        return renderOrderHistory();
      case 'cart':
        return renderCurrentCart();
      case 'payments':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payment methods saved</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews & Ratings</h2>
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reviews yet</p>
              <p className="text-sm text-gray-400">Purchase products to leave reviews</p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Order Updates</div>
                  <div className="text-sm text-gray-500">Get notified about order status changes</div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">New Products</div>
                  <div className="text-sm text-gray-500">Notifications about new seasonal produce</div>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Promotions</div>
                  <div className="text-sm text-gray-500">Special offers and discounts</div>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences & Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Organic products only
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Seasonal produce preferred
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Local farmers priority
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Help & Support</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-gray-600">Find answers to common questions</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600">Get help via chat, email, or phone</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Report an Issue</h3>
                <p className="text-sm text-gray-600">Report problems with orders or payments</p>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
            <div className="space-y-4">
              {/* Email Verification */}
              <EmailVerification />
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add extra security to your account</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowTwoFactorSetup(true)}
                  >
                    Setup
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Login Sessions</h3>
                    <p className="text-sm text-gray-600">Manage active sessions and devices</p>
                  </div>
                  <Button variant="outline">View</Button>
                </div>
              </div>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-600">Permanently delete your customer account and all data</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete your account? This action cannot be undone. 
                    All your orders, cart items, and personal data will be permanently removed.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteAccountMutation.isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => deleteAccountMutation.mutate()}
                      loading={deleteAccountMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return renderPersonalInfo();
    }
  };

  // Handle case where user is not loaded yet
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
            <div className="lg:w-3/4">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Profile</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {renderContent()}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Two-Factor Setup Modal */}
      <TwoFactorSetup 
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
      />
    </div>
  );
}
