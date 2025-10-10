import { X, BookOpen, Package, ShoppingCart, MessageCircle, TrendingUp, DollarSign } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export default function UserGuideModal({ isOpen, onClose, userRole = 'FARMER' }: UserGuideModalProps) {
  if (!isOpen) return null;

  const farmerGuides = [
    {
      icon: Package,
      title: 'Adding Products',
      steps: [
        'Go to "Product Management" tab in your profile',
        'Click "Add New Product" button',
        'Fill in product details (name, price, description, stock)',
        'Upload high-quality product images',
        'Select appropriate category',
        'Click "Save" to publish your product',
      ],
    },
    {
      icon: ShoppingCart,
      title: 'Managing Orders',
      steps: [
        'Navigate to "Orders & Deliveries" section',
        'View all incoming orders in real-time',
        'Click on an order to see details',
        'Update order status (Accept, Preparing, Shipped, Delivered)',
        'Communicate with customers via order chat',
      ],
    },
    {
      icon: DollarSign,
      title: 'Payments & Earnings',
      steps: [
        'Check your earnings in "Payments & Earnings" tab',
        'View transaction history and pending payouts',
        'Payments are processed within 2-3 business days after delivery',
        'Update your bank account details in Settings',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      steps: [
        'Monitor your sales performance',
        'View product popularity and ratings',
        'Track inventory levels',
        'Get recommendations for pricing and stock',
      ],
    },
    {
      icon: MessageCircle,
      title: 'Customer Communication',
      steps: [
        'Respond to customer inquiries promptly',
        'Use the live chat feature for instant support',
        'Build trust through clear communication',
        'Maintain high ratings for better visibility',
      ],
    },
  ];

  const customerGuides = [
    {
      icon: Package,
      title: 'Browsing Products',
      steps: [
        'Browse products by category',
        'Use search to find specific items',
        'View product details, images, and ratings',
        'Check farmer profiles and ratings',
      ],
    },
    {
      icon: ShoppingCart,
      title: 'Placing Orders',
      steps: [
        'Add products to your cart',
        'Review cart and adjust quantities',
        'Proceed to checkout',
        'Enter delivery address',
        'Choose payment method and confirm',
      ],
    },
    {
      icon: MessageCircle,
      title: 'Tracking Orders',
      steps: [
        'View order status in "My Orders"',
        'Get real-time updates on delivery',
        'Chat with farmers for any queries',
        'Confirm delivery once received',
      ],
    },
  ];

  const guides = userRole === 'FARMER' ? farmerGuides : customerGuides;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">User Guide</h2>
              <p className="text-green-100 text-sm">
                {userRole === 'FARMER' ? 'Farmer Portal Guide' : 'Customer Portal Guide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{guide.title}</h3>
                      <ol className="space-y-2">
                        {guide.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start">
                            <span className="flex-shrink-0 h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">
                              {stepIndex + 1}
                            </span>
                            <span className="text-gray-700 text-sm leading-6">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Help */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
            <p className="text-sm text-blue-800 mb-3">
              If you have any questions or need assistance, our support team is here to help!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Start Live Chat
              </button>
              <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                Email Support
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
