import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCartStore } from '../stores/cartStore';
import { getProductMainImage } from '../lib/imageUtils';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  images?: string[];
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
  };

  const imageUrl = getProductMainImage(product as any);
  const rating = product.farmer.farmerProfile?.ratingAvg || 0;

  return (
    <Link to={`/products/${product.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap ml-2">
              {product.category.name}
            </span>
          </div>
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-green-600">
              ₹{product.price}
            </span>
            <span className="text-sm text-gray-500">per {product.unit}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">by</span>
              <span className="text-sm font-medium text-gray-900">
                {product.farmer.farmerProfile?.businessName || product.farmer.name}
              </span>
              {rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="w-full mt-3"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
