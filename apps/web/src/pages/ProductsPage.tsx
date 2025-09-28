import { useState } from 'react';
import { useQuery } from 'react-query';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsData?.products.map((product: Product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <img 
                  src={getProductMainImage(product as any)} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">{product.category.name}</div>
                <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  by {product.farmer.farmerProfile?.businessName || product.farmer.name}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">
                    ₹{product.price}/{product.unit}
                  </span>
                  <button onClick={() => handleAddToCart(product)} className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-semibold flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {productsData?.pagination && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 text-gray-400 rounded-lg font-semibold disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {productsData.pagination.page} of {productsData.pagination.pages}
            </span>
            <button className="px-4 py-2 border border-gray-300 text-gray-400 rounded-lg font-semibold disabled:cursor-not-allowed" disabled>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
