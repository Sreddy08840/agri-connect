import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';

// Using local cart store while server cart is being integrated

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCartStore();

  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    updateQuantity(productId, newQty);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to get started!</p>
          <button 
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">by {item.farmerName}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  ₹{item.price}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleQuantityChange(item.productId, item.qty - 1)}
                  disabled={item.qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.qty}</span>
                <button
                  className="p-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
                  onClick={() => handleQuantityChange(item.productId, item.qty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ₹{(item.price * item.qty).toFixed(2)}
                </p>
                <button
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  onClick={() => handleRemoveItem(item.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-green-600">
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>
          
          <div className="flex space-x-4">
            <button
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
            <button
              className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
