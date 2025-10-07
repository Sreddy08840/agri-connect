import { useQuery } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import { getProductMainImage } from '../lib/imageUtils';
import { ShoppingBag, CheckCircle, Shield, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stockQty: number;
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
    // Check if product is in stock
    if (product.stockQty <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
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
    <div className="space-y-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-farmer-green-600 via-farmer-green-700 to-farmer-green-800 text-white py-20 rounded-3xl shadow-card-lg">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Connect Directly with Farmers</h1>
          <p className="text-green-50 text-xl md:text-2xl mb-8 leading-relaxed">
            Fresh produce, fair prices, transparent supply chain
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="flex items-center px-8 py-4 bg-white text-farmer-green-700 rounded-2xl hover:bg-farmer-beige-50 font-semibold text-lg shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/products')}
            >
              <ShoppingBag className="h-5 w-5 mr-2" /> Shop Now
            </button>
            <button
              className="flex items-center px-8 py-4 border-2 border-white text-white rounded-2xl hover:bg-white hover:text-farmer-green-700 font-semibold text-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/help')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Trending Products</h2>
            <p className="text-gray-600 text-lg">Popular picks from our farmers</p>
          </div>
          <Link to="/products" className="text-farmer-green-600 hover:text-farmer-green-700 font-semibold text-lg flex items-center">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.products?.slice(0, 8).map((product) => (
            <div key={product.id} className="group">
              <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-300 border border-farmer-beige-200 group-hover:border-farmer-green-300 transform group-hover:-translate-y-1">
                <div className="relative h-56 bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200">
                  <img
                    src={getProductMainImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                  {product.stockQty <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-xl bg-red-600 px-4 py-2 rounded-lg">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-farmer-green-700 transition-colors">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    by <span className="font-medium text-farmer-brown-700">{product.farmer?.farmerProfile?.businessName || product.farmer?.name || 'Local Farmer'}</span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-farmer-beige-200">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-farmer-green-600">₹{product.price}</span>
                      <span className="text-xs text-gray-500">per {product.unit}</span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stockQty <= 0}
                      className={`px-4 py-2.5 text-sm rounded-xl font-semibold transition-all duration-200 shadow-md ${
                        product.stockQty <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      {product.stockQty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 border border-farmer-beige-200 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-5 text-gray-900">For Customers</h3>
          <ul className="space-y-4 text-gray-700 text-base mb-6">
            <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-farmer-green-600 flex-shrink-0" /> <span>Fresh produce directly from farmers</span></li>
            <li className="flex items-center gap-3"><Shield className="h-5 w-5 text-farmer-green-600 flex-shrink-0" /> <span>Verified profiles and secure checkout</span></li>
            <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-farmer-green-600 flex-shrink-0" /> <span>Simple ordering and order tracking</span></li>
          </ul>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/products')}
              className="w-full px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Browse products
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="w-full px-6 py-3 border-2 border-farmer-green-600 text-farmer-green-600 rounded-xl hover:bg-farmer-green-50 font-semibold transition-all duration-200"
            >
              View cart
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 border border-farmer-beige-200 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-5 text-gray-900">For Farmers</h3>
          <ul className="space-y-4 text-gray-700 text-base mb-6">
            <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-farmer-yellow-600 flex-shrink-0" /> <span>Create products and manage inventory</span></li>
            <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-farmer-yellow-600 flex-shrink-0" /> <span>Process orders and delivery statuses</span></li>
            <li className="flex items-center gap-3"><Shield className="h-5 w-5 text-farmer-yellow-600 flex-shrink-0" /> <span>Build trust with verified profiles</span></li>
          </ul>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/farmer-register')}
              className="w-full px-6 py-3 bg-gradient-to-r from-farmer-yellow-500 to-farmer-yellow-600 text-white rounded-xl hover:from-farmer-yellow-600 hover:to-farmer-yellow-700 font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Join Now
            </button>
            <button 
              onClick={() => navigate('/farmer-login')}
              className="w-full px-6 py-3 border-2 border-farmer-yellow-500 text-farmer-yellow-600 rounded-xl hover:bg-farmer-yellow-50 font-semibold transition-all duration-200"
            >
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
