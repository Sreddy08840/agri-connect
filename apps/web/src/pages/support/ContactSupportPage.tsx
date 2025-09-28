import { Mail, Phone, MessageCircle, Clock, MapPin, Send, FileText } from 'lucide-react';
import { useState } from 'react';

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
    orderNumber: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supportCategories = [
    { value: 'order-issue', label: 'Order Issue' },
    { value: 'payment-problem', label: 'Payment Problem' },
    { value: 'delivery-issue', label: 'Delivery Issue' },
    { value: 'product-quality', label: 'Product Quality' },
    { value: 'account-help', label: 'Account Help' },
    { value: 'farmer-support', label: 'Farmer Support' },
    { value: 'technical-issue', label: 'Technical Issue' },
    { value: 'general-inquiry', label: 'General Inquiry' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low - General question', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Need assistance', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Urgent issue', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical - Service disruption', color: 'text-red-600' }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      availability: 'Available 9 AM - 9 PM IST',
      action: 'Start Chat',
      primary: true
    },
    {
      icon: <Phone className="h-8 w-8" />,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      availability: '+91-80-1234-5678',
      action: 'Call Now',
      primary: false
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: 'Email Support',
      description: 'Send us a detailed message',
      availability: 'support@agriconnect.com',
      action: 'Send Email',
      primary: false
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h1>
          <p className="text-gray-700 mb-6">
            Thank you for contacting us. We've received your message and will respond within 24 hours.
          </p>
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Ticket ID:</strong> #AGC-{Date.now().toString().slice(-6)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Expected Response:</strong> Within 24 hours
            </p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                category: '',
                priority: 'medium',
                message: '',
                orderNumber: ''
              });
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <MessageCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
        <p className="text-lg text-gray-600">
          Get help from our support team. We're here to assist you with any questions or issues.
        </p>
      </div>

      {/* Quick Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 text-center transition-all hover:shadow-md ${
              method.primary ? 'border-green-500' : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className={`inline-flex p-3 rounded-lg mb-4 ${
              method.primary ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
            }`}>
              {method.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{method.description}</p>
            <p className="text-sm text-gray-500 mb-4">{method.availability}</p>
            <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              method.primary 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'border border-green-600 text-green-600 hover:bg-green-50'
            }`}>
              {method.action}
            </button>
          </div>
        ))}
      </div>

      {/* Support Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Send us a Message</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Order Number (if applicable)
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter order number"
              />
            </div>
          </div>

          {/* Issue Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {supportCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <select
                id="priority"
                name="priority"
                required
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {priorityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Please provide detailed information about your issue or question..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              * Required fields. We typically respond within 24 hours.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Support Hours */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Support Hours</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Live Chat & Phone</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Monday - Friday: 9:00 AM - 9:00 PM IST</li>
              <li>Saturday: 10:00 AM - 6:00 PM IST</li>
              <li>Sunday: 12:00 PM - 6:00 PM IST</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Available 24/7</li>
              <li>Response within 24 hours</li>
              <li>Priority issues: Within 4 hours</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Office Location */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <MapPin className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Our Office</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Address</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Agri-Connect Technologies Pvt. Ltd.<br />
              #123, Technology Park<br />
              Electronic City, Phase 1<br />
              Bengaluru, Karnataka 560100<br />
              India
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Phone:</strong> +91-80-1234-5678</li>
              <li><strong>Email:</strong> support@agriconnect.com</li>
              <li><strong>Business Hours:</strong> Mon-Fri 9 AM - 6 PM IST</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
