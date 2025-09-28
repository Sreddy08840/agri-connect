import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import { getProductMainImage } from '../lib/imageUtils';
import { ShoppingBag, LogIn, CheckCircle, Shield, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  images?: string[];
  farmer?: { name?: string; farmerProfile?: { businessName?: string } };
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { data } = useQuery<{ products: Product[] }>(
    ['landing-trending'],
    () => api.get('/products?limit=8').then(r => r.data)
  );

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      qty: 1,
      farmerId: product.farmer?.name || 'unknown',
      farmerName: product.farmer?.farmerProfile?.businessName || product.farmer?.name || 'Local Farmer',
      image: getProductMainImage(product)
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16 rounded-lg">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Connect Directly with Farmers</h1>
          <p className="text-green-100 text-lg md:text-xl">
            Fresh produce, fair prices, transparent supply chain
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100"
              onClick={() => navigate('/products')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" /> Shop Now
            </button>
            <button
              className="flex items-center px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-green-700"
              onClick={() => navigate('/login')}
            >
              <LogIn className="h-4 w-4 mr-2" /> Customer Login
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link 
              to="/farmer-register" 
              className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold text-lg"
            >
              🚜 Join as Farmer
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Trending Products</h2>
          <Link to="/products" className="text-green-600 hover:text-green-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.products?.slice(0, 8).map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                <img
                  src={getProductMainImage(product)}
                  alt={product.name}
                  className="h-48 w-full object-cover object-center"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  by {product.farmer?.farmerProfile?.businessName || product.farmer?.name || 'Local Farmer'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">₹{product.price}/{product.unit}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">For Customers</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Fresh produce directly from farmers</li>
            <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-green-600" /> Verified profiles and secure checkout</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-green-600" /> Simple ordering and order tracking</li>
          </ul>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => navigate('/products')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Browse products
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              View cart
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">For Farmers</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Create products and manage inventory</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-green-600" /> Process orders and delivery statuses</li>
            <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-green-600" /> Build trust with verified profiles</li>
          </ul>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => navigate('/farmer-register')}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Join Now
            </button>
            <button 
              onClick={() => navigate('/farmer-login')}
              className="w-full px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50"
            >
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
