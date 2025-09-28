import { Search, Book, MessageCircle, Phone, Mail, Users, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: 'Orders & Shopping',
      description: 'Help with placing orders, tracking deliveries, and managing your cart',
      articles: [
        'How to place an order',
        'Track your delivery',
        'Cancel or modify orders',
        'Payment methods accepted',
        'Delivery areas and timing'
      ]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Account Management',
      description: 'Manage your profile, settings, and account preferences',
      articles: [
        'Create an account',
        'Update profile information',
        'Change password',
        'Notification settings',
        'Delete account'
      ]
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'Payments & Billing',
      description: 'Information about payments, refunds, and billing',
      articles: [
        'Payment methods',
        'Refund policy',
        'Invoice and receipts',
        'Payment security',
        'Billing issues'
      ]
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'For Farmers',
      description: 'Help for farmers managing products and orders',
      articles: [
        'Set up farmer profile',
        'Add products to catalog',
        'Manage inventory',
        'Process customer orders',
        'Update delivery status'
      ]
    }
  ];

  const quickActions = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      available: true
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Phone Support',
      description: 'Call us at +91-80-1234-5678',
      action: 'Call Now',
      available: true
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Support',
      description: 'Send us an email',
      action: 'Send Email',
      available: true
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-lg text-gray-600 mb-8">
          Find answers to your questions and get the help you need
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Immediate Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg text-green-600 mr-4">
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                  {action.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {category.articles.map((article, articleIndex) => (
                  <li key={articleIndex}>
                    <a href="#" className="text-sm text-green-600 hover:text-green-700 hover:underline">
                      {article}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">How to track my order?</h3>
              <p className="text-sm text-gray-600">Learn how to check your order status and delivery progress</p>
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600">Information about supported payment options</p>
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">How to become a farmer on the platform?</h3>
              <p className="text-sm text-gray-600">Step-by-step guide to register as a farmer</p>
            </a>
          </div>
          <div className="space-y-3">
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">Delivery areas and timing</h3>
              <p className="text-sm text-gray-600">Check if we deliver to your area and delivery schedules</p>
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">Return and refund policy</h3>
              <p className="text-sm text-gray-600">Understand our return process and refund timeline</p>
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-1">Product quality guarantee</h3>
              <p className="text-sm text-gray-600">Learn about our quality standards and guarantees</p>
            </a>
          </div>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="bg-green-50 rounded-lg p-6 text-center">
        <Book className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Still need help?</h2>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/support/contact"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Contact Support
          </Link>
          <Link
            to="/support/faq"
            className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            View FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
