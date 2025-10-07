import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getProductMainImage } from '../lib/imageUtils';
// Button component removed - using HTML buttons
import { Search, Filter, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';

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
  category: {
    name: string;
    slug: string;
  };
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const addItem = useCartStore((s) => s.addItem);

  const { data: productsData, isLoading } = useQuery(
    ['products', { search, category, sort, order }],
    () => {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);
      
      return api.get(`/products?${params.toString()}`).then(res => res.data);
    }
  );

  const { data: categories } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data)
  );

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
      farmerId: product.farmer.name, // fallback if id missing in this shape
      farmerName: product.farmer.farmerProfile?.businessName || product.farmer.name,
      image: getProductMainImage(product as any),
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 shadow-card border border-farmer-beige-200">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Fresh Products</h1>
          <p className="text-gray-600">Discover farm-fresh produce directly from local farmers</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="px-5 py-2.5 border-2 border-farmer-green-600 text-farmer-green-600 hover:bg-farmer-green-50 rounded-xl font-semibold flex items-center transition-all duration-200">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-farmer-beige-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for fresh produce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200 text-base"
              />
            </div>
          </div>
          
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200 text-base font-medium"
            >
              <option value="">All Categories</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [newSort, newOrder] = e.target.value.split('-');
                setSort(newSort);
                setOrder(newOrder as 'asc' | 'desc');
              }}
              className="w-full px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200 text-base font-medium"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200 h-96 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsData?.products.map((product: Product) => (
            <div key={product.id} className="group">
              <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-farmer-beige-200 group-hover:border-farmer-green-300 transform group-hover:-translate-y-1">
                <div 
                  className="relative h-56 bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200 cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <img 
                    src={getProductMainImage(product as any)} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-white/95 backdrop-blur-sm text-farmer-green-700 px-3 py-1.5 rounded-full font-medium shadow-md border border-farmer-green-200">
                      {product.category.name}
                    </span>
                  </div>
                  {product.stockQty <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-xl bg-red-600 px-4 py-2 rounded-lg">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                  {(product.stockQty > 0 && product.stockQty < 10) && (
                    <div className="absolute top-3 left-3">
                      <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-medium shadow-md">
                        Only {product.stockQty} left
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <h3 
                    className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-farmer-green-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    by <span className="font-medium text-farmer-brown-700">{product.farmer.farmerProfile?.businessName || product.farmer.name}</span>
                  </p>
                  <div className="text-xs text-gray-500">
                    {product.stockQty > 0 ? (
                      <span className="text-green-600 font-medium">✓ In Stock ({product.stockQty} available)</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Out of Stock</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-farmer-beige-200">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-farmer-green-600">
                        ₹{product.price}
                      </span>
                      <span className="text-xs text-gray-500">per {product.unit}</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)} 
                      disabled={product.stockQty <= 0}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-md text-sm ${
                        product.stockQty <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>{product.stockQty <= 0 ? 'Out of Stock' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {productsData?.pagination && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-3 bg-white rounded-2xl p-4 shadow-card border border-farmer-beige-200">
            <button className="px-5 py-2.5 border-2 border-farmer-beige-300 text-gray-400 rounded-xl font-semibold disabled:cursor-not-allowed transition-all duration-200" disabled>
              Previous
            </button>
            <span className="px-6 py-2.5 text-base font-medium text-gray-700 bg-farmer-beige-100 rounded-xl">
              Page {productsData.pagination.page} of {productsData.pagination.pages}
            </span>
            <button className="px-5 py-2.5 border-2 border-farmer-beige-300 text-gray-400 rounded-xl font-semibold disabled:cursor-not-allowed transition-all duration-200" disabled>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
