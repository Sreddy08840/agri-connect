import { 
  UserPlus, 
  LogIn, 
  Upload, 
  ShoppingCart, 
  Package, 
  CreditCard,
  CheckCircle,
  ArrowRight,
  Sprout,
  Users,
  HelpCircle
} from 'lucide-react';

export default function HelpPage() {
  const instructionSections = [
    {
      id: 'register-login',
      title: 'How to Register & Login',
      icon: <UserPlus className="h-8 w-8" />,
      color: 'green',
      steps: [
        {
          icon: <Users className="h-6 w-6" />,
          title: 'Choose Your Account Type',
          description: 'Select whether you want to register as a Customer or Farmer. Customers can browse and buy products, while Farmers can sell their produce.',
          tips: ['Customers: Click "Register" in the top navigation', 'Farmers: Click "Join as Farmer" button']
        },
        {
          icon: <UserPlus className="h-6 w-6" />,
          title: 'Fill Registration Form',
          description: 'Provide your basic information including name, email, phone number, and create a secure password.',
          tips: ['Use a valid email address for verification', 'Choose a strong password (min 8 characters)', 'Farmers need to provide farm details and location']
        },
        {
          icon: <CheckCircle className="h-6 w-6" />,
          title: 'Verify Your Email',
          description: 'Check your email inbox for a verification link. Click the link to activate your account.',
          tips: ['Check spam folder if email not received', 'Verification link expires in 24 hours']
        },
        {
          icon: <LogIn className="h-6 w-6" />,
          title: 'Login to Your Account',
          description: 'Use your registered email and password to login. Farmers use the separate Farmer Login page.',
          tips: ['Remember your credentials for future logins', 'Use "Forgot Password" if you forget your password']
        }
      ]
    },
    {
      id: 'upload-products',
      title: 'How to Upload Products (For Farmers)',
      icon: <Upload className="h-8 w-8" />,
      color: 'yellow',
      steps: [
        {
          icon: <LogIn className="h-6 w-6" />,
          title: 'Login to Farmer Portal',
          description: 'Access your farmer dashboard by logging in through the Farmer Login page.',
          tips: ['Use your farmer credentials', 'Navigate to "Farmer Portal" from the menu']
        },
        {
          icon: <Package className="h-6 w-6" />,
          title: 'Go to Products Section',
          description: 'From your dashboard, click on "Products" in the sidebar to manage your product listings.',
          tips: ['View all your existing products', 'Check product status and inventory']
        },
        {
          icon: <Upload className="h-6 w-6" />,
          title: 'Add New Product',
          description: 'Click "Add Product" button and fill in product details: name, category, price, quantity, and description.',
          tips: ['Upload clear product images (max 5MB)', 'Set competitive prices', 'Provide accurate quantity in stock', 'Write detailed descriptions']
        },
        {
          icon: <CheckCircle className="h-6 w-6" />,
          title: 'Publish Your Product',
          description: 'Review all details and click "Save" to publish your product. It will be visible to customers immediately.',
          tips: ['Edit products anytime from Products page', 'Update inventory regularly', 'Mark products as unavailable when out of stock']
        }
      ]
    },
    {
      id: 'buy-products',
      title: 'How to Buy Products (For Customers)',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'blue',
      steps: [
        {
          icon: <Package className="h-6 w-6" />,
          title: 'Browse Products',
          description: 'Visit the Products page to see all available fresh produce. Use filters to find specific items.',
          tips: ['Filter by category (vegetables, fruits, grains)', 'Search by product name', 'Check product ratings and reviews']
        },
        {
          icon: <ShoppingCart className="h-6 w-6" />,
          title: 'Add to Cart',
          description: 'Click on a product to view details. Select quantity and click "Add to Cart" button.',
          tips: ['Check product description and price', 'View farmer information', 'Add multiple products before checkout']
        },
        {
          icon: <CheckCircle className="h-6 w-6" />,
          title: 'Review Your Cart',
          description: 'Click the cart icon in the top navigation to review your items. Update quantities or remove items if needed.',
          tips: ['Check total amount', 'Apply coupon codes if available', 'Verify delivery address']
        },
        {
          icon: <CreditCard className="h-6 w-6" />,
          title: 'Complete Checkout',
          description: 'Click "Proceed to Checkout", confirm delivery address, choose payment method, and place your order.',
          tips: ['Login or register to checkout', 'Provide accurate delivery address', 'Choose from multiple payment options', 'Track your order from Orders page']
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600',
        accent: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600',
        accent: 'text-yellow-700',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        accent: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700'
      }
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-green-50 to-yellow-50 rounded-2xl p-8 border border-green-100">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <HelpCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Instructions</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Welcome to Agri-Connect! Follow these simple step-by-step guides to get started with our platform.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {instructionSections.map((section) => {
            const colors = getColorClasses(section.color);
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`flex items-center p-4 ${colors.bg} border ${colors.border} rounded-lg hover:shadow-md transition-all`}
              >
                <div className={`flex-shrink-0 p-3 ${colors.iconBg} rounded-lg ${colors.iconText} mr-4`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className={`font-semibold ${colors.accent}`}>{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.steps.length} steps</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Instruction Sections */}
      {instructionSections.map((section) => {
        const colors = getColorClasses(section.color);
        return (
          <div
            key={section.id}
            id={section.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Section Header */}
            <div className={`${colors.bg} border-b ${colors.border} p-6`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-4 ${colors.iconBg} rounded-xl ${colors.iconText} mr-4`}>
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-gray-600 mt-1">Follow these {section.steps.length} simple steps</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-6">
              {section.steps.map((step, stepIndex) => (
                <div key={stepIndex} className="relative">
                  {/* Connector Line */}
                  {stepIndex < section.steps.length - 1 && (
                    <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  <div className="flex items-start space-x-4">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0 relative">
                      <div className={`w-14 h-14 ${colors.iconBg} rounded-full flex items-center justify-center ${colors.iconText} border-2 ${colors.border} bg-white z-10 relative`}>
                        {step.icon}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {stepIndex + 1}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>

                      {/* Tips */}
                      {step.tips && step.tips.length > 0 && (
                        <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
                          <p className={`text-sm font-medium ${colors.accent} mb-2`}>💡 Helpful Tips:</p>
                          <ul className="space-y-1">
                            {step.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-sm text-gray-700 flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Additional Help Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 text-white text-center">
        <Sprout className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
        <p className="text-green-50 mb-6 max-w-2xl mx-auto">
          Our support team is here to assist you. Contact us for any questions or issues you may encounter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/support/contact"
            className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            Contact Support
          </a>
          <a
            href="/support/faq"
            className="px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition-colors font-medium"
          >
            View FAQ
          </a>
          <a
            href="/support/help-center"
            className="px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition-colors font-medium"
          >
            Help Center
          </a>
        </div>
      </div>

      {/* Mobile Friendly Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-700">
          📱 <strong>Mobile Users:</strong> All features are fully optimized for mobile devices. 
          Enjoy the same great experience on your smartphone or tablet!
        </p>
      </div>
    </div>
  );
}
