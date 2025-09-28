import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Order placed successfully</h1>
        <p className="text-gray-600 mt-2">Thank you for your order. A confirmation has been created with the details below.</p>
        <div className="mt-6 inline-flex items-center px-4 py-2 bg-gray-50 rounded border">
          <Package className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Order ID</span>
          <span className="ml-2 font-semibold text-gray-900">#{id?.slice(-8)}</span>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={`/orders/${id}`} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold">
            View Order Details
          </Link>
          <Link to="/products" className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
