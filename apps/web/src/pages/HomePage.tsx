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
    <div className="space-y-12">
      {/* Hero Section with 3D Animation */}
      <section className="relative bg-gradient-to-r from-green-600 to-green-800 text-white py-20 rounded-lg overflow-hidden">
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Connect Directly with Farmers
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100 animate-fade-in-up delay-200">
            Fresh produce, fair prices, transparent supply chain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
            <button 
              className="px-8 py-4 bg-white text-green-600 hover:bg-gray-100 rounded-lg font-semibold flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg"
              onClick={handleShopNow}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Products
            </button>
            <button 
              className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-green-600 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200"
              onClick={handleLearnMore}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Direct Delivery</h3>
            <p className="text-gray-600">Fresh produce delivered directly from farm to your doorstep</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Farmers</h3>
            <p className="text-gray-600">All farmers are verified and quality-checked</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fair Prices</h3>
            <p className="text-gray-600">Support farmers with fair, transparent pricing</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <button 
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Cart
          </button>
        </div>
        {categoriesLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {categories?.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-green-200">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {category.children?.length || 0} subcategories
                  </p>
                </div>
                <button 
                  className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold transition-colors"
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
        <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
        {productsLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {featuredProducts?.products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {product.farmer.farmerProfile?.businessName || product.farmer.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ₹{product.price}/{product.unit}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-semibold transition-colors"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                      <button 
                        className="px-3 py-1 border border-green-600 text-green-600 hover:bg-green-50 rounded text-sm font-semibold transition-colors"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        View
                      </button>
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
