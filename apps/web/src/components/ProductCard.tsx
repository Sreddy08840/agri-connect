import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { getProductMainImage } from '../lib/imageUtils';
import { StarRating } from './StarRating';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQty: number;
  images?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  farmer: {
    id: string;
    name: string;
    farmerProfile?: {
      businessName: string;
      ratingAvg: number;
    };
  };
  category: {
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      farmerId: product.farmer.id,
      farmerName: product.farmer.farmerProfile?.businessName || product.farmer.name,
      image: getProductMainImage(product as any),
    });
    toast.success(`${product.name} added to cart`);
  };

  const imageUrl = getProductMainImage(product as any);
  const rating = product.ratingAvg || 0;
  const ratingCount = product.ratingCount || 0;

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full overflow-hidden border border-farmer-beige-200 group-hover:border-farmer-green-300 transform group-hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-farmer-beige-100 to-farmer-beige-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-white/95 backdrop-blur-sm text-farmer-green-700 px-3 py-1.5 rounded-full font-medium shadow-md border border-farmer-green-200">
              {product.category.name}
            </span>
          </div>
          {/* Rating Badge */}
          {rating > 0 && (
            <div className="absolute top-3 left-3 flex items-center space-x-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
              <StarRating rating={rating} size="sm" showValue />
              <span className="text-xs text-gray-500">({ratingCount})</span>
            </div>
          )}
          {/* Out of Stock Overlay */}
          {product.stockQty <= 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-xl bg-red-600 px-4 py-2 rounded-lg">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg group-hover:text-farmer-green-700 transition-colors">
            {product.name}
          </h3>
          
          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          
          {/* Farmer Info */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">by</span>
            <span className="font-medium text-farmer-brown-700 truncate">
              {product.farmer.farmerProfile?.businessName || product.farmer.name}
            </span>
          </div>
          
          {/* Price and Action */}
          <div className="flex items-center justify-between pt-2 border-t border-farmer-beige-200">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-farmer-green-600">
                ₹{product.price}
              </span>
              <span className="text-xs text-gray-500">per {product.unit}</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stockQty <= 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-md ${
                product.stockQty <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white hover:from-farmer-green-700 hover:to-farmer-green-800 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">{product.stockQty <= 0 ? 'Out of Stock' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
