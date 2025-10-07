import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import { ShoppingBag, Truck, Shield, Heart, Sparkles } from 'lucide-react';
import FloatingVegetables from '../components/3D/FloatingVegetables';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQty: number;
  images?: string[];
  farmer: {
    name: string;
    farmerProfile?: {
      businessName: string;
      ratingAvg: number;
    };
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>(
    'categories',
    () => api.get('/categories').then(res => res.data)
  );

  const { data: featuredProducts, isLoading: productsLoading } = useQuery<{
    products: Product[];
  }>(
    'featured-products',
    () => api.get('/products?featured=true&limit=8').then(res => res.data)
  );

  const handleShopNow = () => {
    navigate('/products');
  };

  const handleLearnMore = () => {
    // Scroll to features section or navigate to about page
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBrowseCategory = (categorySlug: string) => {
    navigate(`/products?category=${categorySlug}`);
  };

  const handleAddToCart = (product: Product) => {
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
      farmerId: product.farmer.name, // Using farmer name as ID for now
      farmerName: product.farmer.farmerProfile?.businessName || product.farmer.name,
      image: product.images?.[0]
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section with 3D Animation */}
      <section className="relative bg-gradient-to-br from-farmer-green-600 via-farmer-green-700 to-farmer-green-800 text-white py-24 rounded-3xl overflow-hidden shadow-card-lg">
        {/* Animated Background */}
        <FloatingVegetables />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 animate-bounce">
            <Sparkles className="h-8 w-8 text-yellow-300 opacity-70" />
          </div>
          <div className="absolute top-20 right-20 animate-pulse">
            <Sparkles className="h-6 w-6 text-green-300 opacity-60" />
          </div>
          <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
            <Sparkles className="h-10 w-10 text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
            Connect Directly with Farmers
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-green-50 animate-fade-in-up delay-200 leading-relaxed">
            Fresh produce, fair prices, transparent supply chain
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in-up delay-400">
            <button 
              className="px-10 py-4 bg-white text-farmer-green-700 hover:bg-farmer-beige-50 rounded-2xl font-semibold flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-xl text-lg"
              onClick={handleShopNow}
            >
              <ShoppingBag className="mr-2 h-6 w-6" />
              Shop Now
            </button>
            <button 
              className="px-10 py-4 border-2 border-white text-white hover:bg-white hover:text-farmer-green-700 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-200 text-lg"
              onClick={handleLearnMore}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-farmer-beige-200 group">
            <div className="bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
              <Truck className="h-10 w-10 text-farmer-green-700" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-900">Direct Delivery</h3>
            <p className="text-gray-600 leading-relaxed">Fresh produce delivered directly from farm to your doorstep</p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-farmer-beige-200 group">
            <div className="bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-10 w-10 text-farmer-green-700" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-900">Verified Farmers</h3>
            <p className="text-gray-600 leading-relaxed">All farmers are verified and quality-checked</p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-farmer-beige-200 group">
            <div className="bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
              <Heart className="h-10 w-10 text-farmer-green-700" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-900">Fair Prices</h3>
            <p className="text-gray-600 leading-relaxed">Support farmers with fair, transparent pricing</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Explore our wide range of fresh produce</p>
          </div>
          <button 
            className="flex items-center px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            View Cart
          </button>
        </div>
        {categoriesLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200 h-64 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {categories?.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-farmer-beige-200 hover:border-farmer-green-300 group">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">🌱</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">{category.name}</h3>
                  <p className="text-gray-600">
                    {category.children?.length || 0} subcategories
                  </p>
                </div>
                <button 
                  className="w-full px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  onClick={() => handleBrowseCategory(category.slug)}
                >
                  Browse {category.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Featured Products</h2>
          <p className="text-gray-600 text-lg">Handpicked fresh produce from our best farmers</p>
        </div>
        {productsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200 h-96 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.products.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-300 border border-farmer-beige-200 group-hover:border-farmer-green-300 transform group-hover:-translate-y-1">
                  <div className="relative h-56 bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    {product.stockQty <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-xl bg-red-600 px-4 py-2 rounded-lg">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-farmer-green-700 transition-colors">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      by <span className="font-medium text-farmer-brown-700">{product.farmer.farmerProfile?.businessName || product.farmer.name}</span>
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-farmer-beige-200">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-farmer-green-600">
                          ₹{product.price}
                        </span>
                        <span className="text-xs text-gray-500">per {product.unit}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md ${
                            product.stockQty <= 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 hover:shadow-lg transform hover:scale-105'
                          }`}
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stockQty <= 0}
                        >
                          {product.stockQty <= 0 ? 'Out of Stock' : 'Add'}
                        </button>
                        <button 
                          className="px-4 py-2 border-2 border-farmer-green-600 text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl text-sm font-semibold transition-all duration-200"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
