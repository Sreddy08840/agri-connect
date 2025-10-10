import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { getFirstImageUrl } from '../lib/imageUtils';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Tractor,
  Package,
  BarChart3,
  DollarSign,
  Settings,
  HelpCircle,
  Shield,
  TrendingUp,
  FileText,
  Edit2,
  Plus,
  AlertTriangle,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  IndianRupee,
  CreditCard,
  Wallet,
  PieChart,
  Activity,
  Bell,
  Globe,
  MessageCircle,
  BookOpen,
  Filter,
  Download,
  RefreshCw,
  Check
} from 'lucide-react';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import UserGuideModal from '../components/UserGuideModal';
import EmailSupportModal from '../components/EmailSupportModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorSetup from '../components/TwoFactorSetup';
import EmailVerification from '../components/EmailVerification';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import socketService from '../lib/socket';
import LiveChatSupport from '../components/LiveChatSupport';

const farmerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  description: z.string().optional(),
  farmType: z.string().optional(),
  cultivationArea: z.string().optional(),
  certifications: z.string().optional(),
});

type FarmerProfileFormData = z.infer<typeof farmerProfileSchema>;

export default function FarmerProfilePage() {
  const { user, setUser, clearUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showEmailSupport, setShowEmailSupport] = useState(false);

  const form = useForm<FarmerProfileFormData>({
    resolver: zodResolver(farmerProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      address: typeof user?.address === 'string' ? user?.address : '',
      phone: user?.phone || '',
      businessName: user?.farmerProfile?.businessName || '',
      description: user?.farmerProfile?.businessName || '',
      farmType: '',
      cultivationArea: '',
      certifications: '',
    }
  });

  // Profile update mutation
  const updateProfileMutation = useMutation(
    (data: FarmerProfileFormData) => api.patch('/users/me', {
      name: data.name,
      email: data.email,
      address: data.address,
      farmerProfile: {
        businessName: data.businessName,
        description: data.description,
        farmType: data.farmType,
        cultivationArea: data.cultivationArea,
        certifications: data.certifications,
      }
    }),
    {
      onSuccess: async (res) => {
        toast.success('Profile updated successfully');
        // Refresh user data from /auth/me to get complete user object
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Don't clear user on refresh failure, just use the update response
          if (res.data?.user) {
            setUser({ ...user, ...res.data.user, farmerProfile: res.data.farmerProfile || user?.farmerProfile });
          } else if (res.data) {
            // If the response is the user object directly
            setUser({ ...user, ...res.data });
          }
        }
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

  // Order status update mutation
  const updateOrderStatusMutation = useMutation(
    ({ orderId, status }: { orderId: string; status: string }) => 
      api.patch(`/orders/${orderId}/status`, { status }),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully');
        // Refresh orders data
        window.location.reload();
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.error || 'Failed to update order status');
      }
    }
  );

  const handleOrderStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleExportData = (type: string) => {
    toast.success(`Exporting ${type} data...`);
    // TODO: Implement actual export functionality
  };

  const handleFilterByMonth = () => {
    toast.info('Filtering by current month...');
    // TODO: Implement month filtering
  };

  // Fetch farmer data
  const { data: productsData } = useQuery(
    'farmer-products',
    () => api.get('/products/my-products').then(res => res.data),
    { enabled: !!user }
  );

  // Live updates for product status
  useEffect(() => {
    if (!user?.id) return;
    const sock = socketService.connect();
    socketService.joinFarmerRoom(user.id);

    const onStatus = () => {
      // refetch via a hard reload or trigger react-query invalidation if available here
      window.dispatchEvent(new Event('focus')); // triggers react-query refetch on window focus if configured
      // directly reload for now for reliability
      // window.location.reload();
    };

    socketService.onProductStatus(onStatus);

    return () => {
      socketService.offProductStatus(onStatus);
      socketService.leaveFarmerRoom(user.id);
    };
  }, [user?.id]);
  const products = productsData?.products || [];

  const { data: ordersData } = useQuery(
    'farmer-orders',
    () => api.get('/orders/farmer-orders').then(res => res.data),
    { enabled: !!user }
  );
  const orders = ordersData?.orders || [];

  // Fetch analytics data
  const { data: analyticsData } = useQuery(
    'farmer-analytics',
    () => {
      // Calculate analytics from existing data
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        order.status === 'DELIVERED' ? sum + order.total : sum, 0);
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => ['PLACED', 'ACCEPTED'].includes(o.status)).length;
      const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED').length;
      const lowStockProducts = products.filter((p: any) => p.stockQty < 10).length;
      
      // Calculate monthly revenue from actual orders
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthRevenue = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate.getMonth() === currentMonth && 
            orderDate.getFullYear() === currentYear && 
            order.status === 'DELIVERED') {
          return sum + order.total;
        }
        return sum;
      }, 0);
      
      // Calculate pending payments (orders that are not yet delivered)
      const pendingPayments = orders.reduce((sum: number, order: any) => 
        order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? sum + order.total : sum, 0);
      
      // Calculate product sales from order items
      const productSales = new Map();
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = item.productId || item.product?.id;
            if (productId) {
              const current = productSales.get(productId) || 0;
              productSales.set(productId, current + (item.quantity || 0));
            }
          });
        }
      });
      
      return Promise.resolve({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        lowStockProducts,
        thisMonthRevenue,
        pendingPayments,
        productSales,
        monthlyRevenue: Array.from({length: 12}, (_, i) => {
          const monthRevenue = orders.reduce((sum: number, order: any) => {
            const orderDate = new Date(order.createdAt);
            if (orderDate.getMonth() === i && 
                orderDate.getFullYear() === currentYear && 
                order.status === 'DELIVERED') {
              return sum + order.total;
            }
            return sum;
          }, 0);
          return {
            month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
            revenue: monthRevenue
          };
        }),
        topProducts: products.slice(0, 5).map((p: any) => ({
          ...p,
          sales: productSales.get(p.id) || 0
        }))
      });
    },
    { enabled: !!user && products.length >= 0 && orders.length >= 0 }
  );

  const onSubmit = (data: FarmerProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getProductMainImage = (product: any) => {
    let images: string[] = [];
    
    if (product?.images) {
      if (Array.isArray(product.images)) {
        images = product.images;
      } else if (typeof product.images === 'string') {
        try {
          // Try to parse as JSON first (new format)
          images = JSON.parse(product.images);
        } catch {
          // Fallback to comma-separated format (old format)
          images = product.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }
    
    return getFirstImageUrl(images);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'farm', label: 'Farm Details', icon: Tractor },
    { id: 'products', label: 'Product Management', icon: Package },
    { id: 'inventory', label: 'Inventory Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Orders & Deliveries', icon: FileText },
    { id: 'payments', label: 'Payments & Earnings', icon: DollarSign },
    { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Support & Help', icon: HelpCircle },
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
          <div className="text-sm text-gray-500">Farmer Account</div>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email" 
                {...form.register('email')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              />
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
              <label className="block text-sm font-medium text-gray-700">Farm Address</label>
              <textarea 
                {...form.register('address')} 
                className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                rows={3}
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
                <div className="text-sm text-gray-500">Farm Address</div>
                <div className="font-medium">{user?.address || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFarmDetails = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Farm Details</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
          <input 
            {...form.register('businessName')} 
            className="w-full border rounded-md px-3 py-2" 
            placeholder="Your farm/business name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Farm Type</label>
          <select 
            {...form.register('farmType')} 
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">Select farm type</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="grains">Grains</option>
            <option value="dairy">Dairy</option>
            <option value="mixed">Mixed Farming</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cultivation Area</label>
          <input 
            {...form.register('cultivationArea')} 
            className="w-full border rounded-md px-3 py-2" 
            placeholder="e.g., 5 acres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
          <input 
            {...form.register('certifications')} 
            className="w-full border rounded-md px-3 py-2" 
            placeholder="Organic, Sustainable, etc."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Farm Description</label>
          <textarea 
            {...form.register('description')} 
            className="w-full border rounded-md px-3 py-2" 
            rows={4}
            placeholder="Describe your farm, products, and farming practices"
          />
        </div>
      </div>
    </div>
  );

  const renderProductManagement = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
        <Button 
          onClick={() => setShowAddProduct(true)}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products listed yet</p>
          <p className="text-sm text-gray-400">Start by adding your first product</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="border rounded-lg p-4">
              <div className="aspect-w-16 aspect-h-9 mb-3">
                <img 
                  src={getProductMainImage(product)}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-green-600">₹{product.price}</span>
                <span className="text-sm text-gray-500">Stock: {product.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'farm':
        return renderFarmDetails();
      case 'products':
        return renderProductManagement();
      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Inventory Dashboard</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => handleExportData('inventory')}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-700">{products.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {products.filter((p: any) => p.stockQty < 10).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">In Stock</p>
                      <p className="text-2xl font-bold text-green-700">
                        {products.filter((p: any) => p.stockQty > 0).length}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-700">
                        {products.filter((p: any) => p.stockQty === 0).length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product: any) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src={getProductMainImage(product)} 
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.svg';
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            product.stockQty === 0 ? 'text-red-600' : 
                            product.stockQty < 10 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stockQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            product.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <IconButton 
                              variant="outline" 
                              size="sm"
                              icon={<Edit2 className="h-4 w-4" />}
                              tooltip="Edit product"
                              onClick={() => handleEditProduct(product)}
                            />
                            <IconButton 
                              variant="outline" 
                              size="sm"
                              icon={<Eye className="h-4 w-4" />}
                              tooltip="View product details"
                              onClick={() => handleViewProduct(product)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Orders & Deliveries</h2>
                <div className="flex gap-2">
                  <IconButton 
                    variant="outline" 
                    icon={<Filter className="h-4 w-4" />}
                    tooltip="Filter orders"
                    onClick={() => toast.info('Filter functionality coming soon...')}
                  />
                  <IconButton 
                    variant="outline" 
                    icon={<Download className="h-4 w-4" />}
                    tooltip="Export orders"
                    onClick={() => handleExportData('orders')}
                  />
                </div>
              </div>

              {/* Order Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-700">{orders.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {orders.filter((o: any) => ['PLACED', 'ACCEPTED'].includes(o.status)).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Delivered</p>
                      <p className="text-2xl font-bold text-green-700">
                        {orders.filter((o: any) => o.status === 'DELIVERED').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">In Transit</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {orders.filter((o: any) => ['PACKED', 'SHIPPED'].includes(o.status)).length}
                      </p>
                    </div>
                    <Truck className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-sm text-gray-400">Orders will appear here once customers place them</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order: any) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{order.orderNumber || order.id.slice(-8)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.customer?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{order.total}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'PACKED' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'ACCEPTED' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'PLACED' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <IconButton 
                                variant="outline" 
                                size="sm"
                                icon={<Eye className="h-4 w-4" />}
                                tooltip="View order details"
                                onClick={() => handleViewOrder(order)}
                              />
                              {order.status === 'PLACED' && (
                                <IconButton 
                                  variant="primary" 
                                  size="sm"
                                  icon={<Check className="h-4 w-4" />}
                                  tooltip="Accept order"
                                  onClick={() => handleOrderStatusUpdate(order.id, 'ACCEPTED')}
                                  loading={updateOrderStatusMutation.isLoading}
                                />
                              )}
                              {order.status === 'ACCEPTED' && (
                                <IconButton 
                                  variant="secondary" 
                                  size="sm"
                                  icon={<Package className="h-4 w-4" />}
                                  tooltip="Mark as packed"
                                  onClick={() => handleOrderStatusUpdate(order.id, 'PACKED')}
                                  loading={updateOrderStatusMutation.isLoading}
                                />
                              )}
                              {order.status === 'PACKED' && (
                                <IconButton 
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                  icon={<Truck className="h-4 w-4" />}
                                  tooltip="Ship order"
                                  onClick={() => handleOrderStatusUpdate(order.id, 'SHIPPED')}
                                  loading={updateOrderStatusMutation.isLoading}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-600">Permanently delete your farmer account and all data</p>
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
                    All your products, orders, and data will be permanently removed.
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
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payments & Earnings</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleFilterByMonth}
                  >
                    <Calendar className="h-4 w-4" />
                    This Month
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => handleExportData('payments')}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Earnings Overview */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₹{analyticsData?.totalRevenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">This Month</p>
                      <p className="text-2xl font-bold text-blue-700">₹{analyticsData?.thisMonthRevenue?.toLocaleString() || '0'}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">Pending Payments</p>
                      <p className="text-2xl font-bold text-purple-700">₹{analyticsData?.pendingPayments?.toLocaleString() || '0'}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Avg Order Value</p>
                      <p className="text-2xl font-bold text-orange-700">
                        ₹{orders.length > 0 ? Math.round(orders.reduce((sum: number, o: any) => sum + o.total, 0) / orders.length) : 0}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <IndianRupee className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Order #{order.orderNumber || order.id.slice(-8)}</div>
                          <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">₹{order.total}</div>
                        <div className={`text-xs ${
                          order.status === 'DELIVERED' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {order.status === 'DELIVERED' ? 'Paid' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last 30 Days
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ₹{analyticsData?.totalRevenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Orders Completed</p>
                      <p className="text-2xl font-bold text-green-700">{analyticsData?.completedOrders || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">Customer Rating</p>
                      <p className="text-2xl font-bold text-yellow-700">4.8</p>
                    </div>
                    <Activity className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">Products Listed</p>
                      <p className="text-2xl font-bold text-purple-700">{products.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Monthly Revenue Trend
                  </h3>
                  <div className="h-64">
                    {analyticsData?.monthlyRevenue && analyticsData.monthlyRevenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '8px'
                            }}
                            formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No revenue data available yet</p>
                          <p className="text-sm">Complete some orders to see trends</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Top Performing Products
                  </h3>
                  <div className="space-y-3">
                    {analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
                      analyticsData.topProducts.map((product: any, index: number) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">₹{product.price}/{product.unit}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{product.sales} sold</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No sales data available yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
              
              {/* Notification Settings */}
              <div className="border-b pb-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">New Order Notifications</div>
                      <div className="text-sm text-gray-500">Get notified when you receive new orders</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Payment Notifications</div>
                      <div className="text-sm text-gray-500">Get notified about payment updates</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Marketing Updates</div>
                      <div className="text-sm text-gray-500">Receive updates about new features and promotions</div>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </div>

              {/* Business Settings */}
              <div className="border-b pb-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Business Settings
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                    <select className="w-full border rounded-md px-3 py-2">
                      <option>9:00 AM - 6:00 PM</option>
                      <option>8:00 AM - 8:00 PM</option>
                      <option>24/7</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Radius (km)</label>
                    <input type="number" defaultValue="25" className="w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Value</label>
                    <input type="number" defaultValue="200" className="w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Processing Time (hours)</label>
                    <input type="number" defaultValue="24" className="w-full border rounded-md px-3 py-2" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="bg-green-600 hover:bg-green-700">
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Support & Help</h2>
              
              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-2">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-3">Get instant help from our support team</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowLiveChat(true)}
                  >
                    Start Chat
                  </Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-2">User Guide</h3>
                  <p className="text-sm text-gray-600 mb-3">Learn how to use all platform features</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUserGuide(true)}
                  >
                    View Guide
                  </Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Mail className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-3">Send us an email for detailed assistance</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEmailSupport(true)}
                  >
                    Send Email
                  </Button>
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">How do I add new products?</h4>
                    <p className="text-sm text-gray-600">Go to Product Management tab and click "Add New Product". Fill in the details and upload images.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">How do I manage orders?</h4>
                    <p className="text-sm text-gray-600">Use the Orders & Deliveries section to view, accept, and update order status.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">When do I get paid?</h4>
                    <p className="text-sm text-gray-600">Payments are processed within 2-3 business days after order delivery confirmation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <div className="text-center py-8">
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Farmer Profile</h1>
      
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

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={() => {
          // Refresh products list
          window.location.reload();
        }}
      />

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">#{selectedOrder.orderNumber || selectedOrder.id.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.status === 'PACKED' ? 'bg-purple-100 text-purple-800' :
                    selectedOrder.status === 'ACCEPTED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customer?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer?.phone || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">₹{selectedOrder.total}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                <div className="border rounded-lg p-3">
                  <p className="text-sm">{selectedOrder.items?.length || 0} items</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setShowProductDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img 
                  src={
                    selectedProduct.images 
                      ? (selectedProduct.images.split(',')[0].startsWith('/') 
                          ? `http://localhost:8080${selectedProduct.images.split(',')[0]}` 
                          : selectedProduct.images.split(',')[0])
                      : '/placeholder-product.jpg'
                  } 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Product Name</p>
                  <p className="font-medium text-lg">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedProduct.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium text-lg text-green-600">₹{selectedProduct.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Quantity</p>
                  <p className={`font-medium ${
                    selectedProduct.stockQty === 0 ? 'text-red-600' : 
                    selectedProduct.stockQty < 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedProduct.stockQty} {selectedProduct.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedProduct.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    selectedProduct.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-700">{selectedProduct.description || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal 
        isOpen={showEditProduct}
        onClose={() => setShowEditProduct(false)}
        product={selectedProduct}
        onSuccess={() => {
          setShowEditProduct(false);
          // Refresh products list
          window.location.reload();
        }}
      />

      {/* Live Chat Support */}
      <LiveChatSupport 
        isOpen={showLiveChat}
        onClose={() => setShowLiveChat(false)}
      />

      {/* User Guide Modal */}
      <UserGuideModal 
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        userRole={user?.role}
      />

      {/* Email Support Modal */}
      <EmailSupportModal 
        isOpen={showEmailSupport}
        onClose={() => setShowEmailSupport(false)}
      />
    </div>
  );
}
