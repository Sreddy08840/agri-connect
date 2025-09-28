import { Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-lg text-gray-600">
          Last updated: January 15, 2025
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment to Your Privacy</h2>
        <p className="text-gray-700 leading-relaxed">
          At Agri-Connect, we are committed to protecting your privacy and ensuring the security of your personal information. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform 
          to connect farmers and customers in Karnataka.
        </p>
      </div>

      {/* Information We Collect */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Database className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Name, email address, and phone number</li>
              <li>Delivery address and location information</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Profile photos and business information (for farmers)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Products viewed, searched, and purchased</li>
              <li>Order history and preferences</li>
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Messages between farmers and customers</li>
              <li>Customer support interactions</li>
              <li>Reviews and ratings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How We Use Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Eye className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Service Delivery</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Process and fulfill orders</li>
              <li>Facilitate communication between farmers and customers</li>
              <li>Provide customer support</li>
              <li>Send order confirmations and updates</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Improvement</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Analyze usage patterns and preferences</li>
              <li>Improve our services and user experience</li>
              <li>Develop new features and functionality</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Information Sharing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Information Sharing</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              We do not sell, trade, or rent your personal information to third parties.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">We may share information in these situations:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>With Farmers:</strong> Customer contact information for order fulfillment and delivery</li>
              <li><strong>With Customers:</strong> Farmer business information and product details</li>
              <li><strong>Service Providers:</strong> Payment processors, delivery services, and technical support</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Data Security</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            We implement appropriate technical and organizational security measures to protect your personal information:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Technical Safeguards</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• SSL encryption for data transmission</li>
                <li>• Secure server infrastructure</li>
                <li>• Regular security audits</li>
                <li>• Access controls and authentication</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Organizational Measures</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Employee training on data protection</li>
                <li>• Limited access to personal data</li>
                <li>• Regular policy reviews</li>
                <li>• Incident response procedures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Your Rights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Your Rights</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">You have the following rights regarding your personal information:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Access & Control</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Access your personal data</li>
                <li>• Update or correct information</li>
                <li>• Delete your account</li>
                <li>• Export your data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Communication Preferences</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Opt-out of marketing emails</li>
                <li>• Manage notification settings</li>
                <li>• Control data sharing preferences</li>
                <li>• Request data portability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cookies and Tracking */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            We use cookies and similar technologies to enhance your experience on our platform:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Essential Cookies</h4>
                <p className="text-gray-600">Required for basic functionality</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Analytics Cookies</h4>
                <p className="text-gray-600">Help us improve our services</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Preference Cookies</h4>
                <p className="text-gray-600">Remember your settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-green-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
        <p className="text-gray-700 mb-4">
          If you have any questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> privacy@agriconnect.com</p>
          <p><strong>Phone:</strong> +91-80-1234-5678</p>
          <p><strong>Address:</strong> Agri-Connect, Bengaluru, Karnataka, India</p>
        </div>
      </div>

      {/* Updates */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Policy Updates:</strong> We may update this Privacy Policy from time to time. 
          We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
        </p>
      </div>
    </div>
  );
}
