import { HelpCircle, ChevronDown, ChevronUp, Search, ShoppingBag, Users, CreditCard, Truck } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const faqCategories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="h-5 w-5" /> },
    { id: 'orders', name: 'Orders & Shopping', icon: <ShoppingBag className="h-5 w-5" /> },
    { id: 'account', name: 'Account', icon: <Users className="h-5 w-5" /> },
    { id: 'payments', name: 'Payments', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'delivery', name: 'Delivery', icon: <Truck className="h-5 w-5" /> }
  ];

  const faqs = [
    {
      id: 1,
      category: 'orders',
      question: 'How do I place an order?',
      answer: 'To place an order, browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account and provide delivery information. Once you confirm your order, the farmer will be notified and can accept or decline based on availability.'
    },
    {
      id: 2,
      category: 'orders',
      question: 'Can I track my order?',
      answer: 'Yes! Once your order is confirmed by the farmer, you can track its status in your Orders section. You\'ll receive notifications for key updates like order acceptance, preparation, dispatch, and delivery.'
    },
    {
      id: 3,
      category: 'orders',
      question: 'Can I cancel or modify my order?',
      answer: 'You can cancel orders before they are accepted by the farmer. Once accepted, modifications depend on the farmer\'s policy. Contact the farmer directly through our messaging system or reach out to our support team for assistance.'
    },
    {
      id: 4,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on "Register" in the top right corner, choose whether you\'re a customer or farmer, and fill in your details. You\'ll need to verify your email address to activate your account. Farmers may need additional verification for their profiles.'
    },
    {
      id: 5,
      category: 'account',
      question: 'I forgot my password. How do I reset it?',
      answer: 'On the login page, click "Forgot Password" and enter your email address. We\'ll send you a reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 6,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile page by clicking on your name in the header. You can update your personal information, delivery address, and preferences. Farmers can also update their farm details and product listings.'
    },
    {
      id: 7,
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit/debit cards, UPI payments, net banking, and digital wallets. All payments are processed securely through our payment partners. Cash on delivery may be available in select areas.'
    },
    {
      id: 8,
      category: 'payments',
      question: 'When will I be charged for my order?',
      answer: 'Payment is processed when you place the order. If a farmer declines your order, you\'ll receive a full refund within 3-5 business days. For cash on delivery orders, payment is collected at the time of delivery.'
    },
    {
      id: 9,
      category: 'payments',
      question: 'What is your refund policy?',
      answer: 'We offer refunds for cancelled orders, quality issues reported within 24 hours of delivery, and if farmers are unable to fulfill orders. Refunds are processed to your original payment method within 3-7 business days.'
    },
    {
      id: 10,
      category: 'delivery',
      question: 'What are your delivery areas?',
      answer: 'We currently deliver across major cities in Karnataka including Bengaluru, Mysuru, Hubli-Dharwad, and surrounding areas. Enter your pincode during checkout to check if we deliver to your location.'
    },
    {
      id: 11,
      category: 'delivery',
      question: 'How long does delivery take?',
      answer: 'Delivery times vary based on product type and farmer location. Fresh produce typically takes 1-3 days, while processed goods may take 2-5 days. You\'ll see estimated delivery times during checkout.'
    },
    {
      id: 12,
      category: 'delivery',
      question: 'What if I\'m not available for delivery?',
      answer: 'Our delivery partners will attempt to contact you before delivery. If you\'re unavailable, they may leave the package with a trusted neighbor (with your permission) or reschedule delivery. Some areas offer pickup points as an alternative.'
    },
    {
      id: 13,
      category: 'orders',
      question: 'What if I receive damaged or poor quality products?',
      answer: 'If you receive products that don\'t meet quality standards, contact us within 24 hours with photos. We\'ll work with the farmer to resolve the issue and may offer a refund or replacement depending on the situation.'
    },
    {
      id: 14,
      category: 'account',
      question: 'How do I become a farmer on the platform?',
      answer: 'Register as a farmer during signup, complete your farm profile with business details and certifications, and submit for verification. Our team will review your application and approve qualified farmers within 2-3 business days.'
    },
    {
      id: 15,
      category: 'orders',
      question: 'Can I order in bulk for my business?',
      answer: 'Yes! Many farmers offer bulk pricing for restaurants, retailers, and other businesses. Contact farmers directly through our platform to discuss bulk orders and special pricing. You can also reach out to our business support team.'
    },
    {
      id: 16,
      category: 'payments',
      question: 'How do farmers receive payments?',
      answer: 'Farmers receive payments after successful order completion and customer confirmation. Payments are transferred to their registered bank accounts within 2-3 business days, minus our small platform fee.'
    },
    {
      id: 17,
      category: 'delivery',
      question: 'Do you deliver organic products separately?',
      answer: 'Organic products are handled with special care to maintain their integrity. They may be packaged separately and some farmers offer dedicated organic delivery slots to ensure no cross-contamination.'
    },
    {
      id: 18,
      category: 'account',
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings in your profile and select "Delete Account". Note that this action is permanent and will remove all your data. Complete any pending orders before deletion.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <HelpCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600">
          Find quick answers to common questions about Agri-Connect
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                activeCategory === category.id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {category.icon}
              <span className="ml-2">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                {openFAQ === faq.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFAQ === faq.id && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse a different category.
            </p>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-green-50 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h2>
        <p className="text-gray-600 mb-4">
          Can't find the answer you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/support/contact"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/support/help-center"
            className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Visit Help Center
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{faqs.length}</div>
            <div className="text-sm text-gray-600">Total FAQs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-gray-600">Support Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">&lt;2hrs</div>
            <div className="text-sm text-gray-600">Average Response Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
