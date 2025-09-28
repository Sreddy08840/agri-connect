import { FileText, Scale, AlertTriangle, CheckCircle, Users, ShoppingBag } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <FileText className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
        <p className="text-lg text-gray-600">
          Last updated: January 15, 2025
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Agri-Connect</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          These Terms and Conditions ("Terms") govern your use of the Agri-Connect platform, which connects farmers 
          and customers in Karnataka for direct agricultural trade. By accessing or using our services, you agree to 
          be bound by these Terms.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Important:</strong> Please read these Terms carefully before using our platform. 
            If you do not agree with any part of these Terms, you must not use our services.
          </p>
        </div>
      </div>

      {/* Definitions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Definitions</h2>
        <div className="space-y-3">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-700"><strong>"Platform"</strong> refers to the Agri-Connect website and mobile application</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-700"><strong>"Farmer"</strong> refers to agricultural producers who sell products through our platform</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-700"><strong>"Customer"</strong> refers to individuals or businesses who purchase products through our platform</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-700"><strong>"Products"</strong> refers to agricultural goods listed and sold on the platform</p>
          </div>
        </div>
      </div>

      {/* User Accounts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">User Accounts</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Registration</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One person may maintain only one account</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Keep your login credentials secure and confidential</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>Update your information to keep it current and accurate</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* For Farmers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <ShoppingBag className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Terms for Farmers</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Product Listings</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>All product information must be accurate and truthful</li>
              <li>Products must comply with food safety and quality standards</li>
              <li>Pricing must be clearly stated and honored</li>
              <li>Inventory levels must be kept up to date</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Fulfillment</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Accept or decline orders within 24 hours</li>
              <li>Fulfill accepted orders within agreed timeframes</li>
              <li>Maintain product quality as described in listings</li>
              <li>Communicate proactively with customers about order status</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Standards</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ul className="text-green-800 space-y-1">
                <li>• Products must be fresh and of merchantable quality</li>
                <li>• Organic products must have valid certifications</li>
                <li>• Proper handling and storage practices must be followed</li>
                <li>• Any pesticide use must be disclosed and within legal limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* For Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Terms for Customers</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ordering and Payment</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Orders are subject to farmer acceptance and product availability</li>
              <li>Payment must be made through approved payment methods</li>
              <li>Prices are subject to change until order confirmation</li>
              <li>Additional delivery charges may apply based on location</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery and Returns</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Delivery times are estimates and may vary due to weather or other factors</li>
              <li>You must be available to receive deliveries at scheduled times</li>
              <li>Returns are accepted only for quality issues reported within 24 hours</li>
              <li>Perishable items may have limited return eligibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Scale className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Platform Rules</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Prohibited Activities</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Fraudulent or misleading information</li>
              <li>Harassment or abusive behavior</li>
              <li>Violation of intellectual property rights</li>
              <li>Spam or unsolicited communications</li>
              <li>Circumventing platform fees</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content Guidelines</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Content must be relevant and appropriate</li>
              <li>No offensive or discriminatory language</li>
              <li>Respect intellectual property rights</li>
              <li>Accurate product descriptions and images</li>
              <li>Professional communication standards</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fees and Payments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fees and Payments</h2>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Platform Fees</h3>
            <p className="text-yellow-800 text-sm">
              Agri-Connect charges a small commission on successful transactions to maintain and improve our platform. 
              Current fee structure is available in your account dashboard.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Processing</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Payments are processed through secure third-party providers</li>
              <li>Farmers receive payments after successful order completion</li>
              <li>Refunds are processed according to our refund policy</li>
              <li>All fees and taxes are clearly disclosed before payment</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Liability and Disclaimers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Liability and Disclaimers</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-900 mb-2">Platform Disclaimer</h3>
            <p className="text-orange-800 text-sm">
              Agri-Connect acts as a marketplace platform connecting farmers and customers. We do not directly sell 
              products or guarantee the quality, safety, or legality of products listed by farmers.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Limitation of Liability</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>We are not liable for disputes between farmers and customers</li>
              <li>Product quality and safety are the responsibility of farmers</li>
              <li>We do not guarantee continuous platform availability</li>
              <li>Our liability is limited to the amount of fees paid to us</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Termination */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Termination</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Termination by User</h3>
            <p className="text-gray-700 mb-2">
              You may terminate your account at any time by contacting our support team. Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Your account will be deactivated</li>
              <li>Pending orders must be completed or cancelled</li>
              <li>Outstanding payments will be processed</li>
              <li>Your data will be handled according to our Privacy Policy</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Termination by Agri-Connect</h3>
            <p className="text-gray-700 mb-2">
              We may terminate accounts for violations of these Terms, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Fraudulent activity or misrepresentation</li>
              <li>Repeated quality or service issues</li>
              <li>Violation of platform rules</li>
              <li>Non-payment of fees</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Governing Law */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
        <p className="text-gray-700 mb-4">
          These Terms are governed by the laws of India and the state of Karnataka. Any disputes will be resolved 
          through the courts of Bengaluru, Karnataka.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 text-sm">
            <strong>Dispute Resolution:</strong> We encourage users to contact our support team first to resolve 
            any issues. If necessary, disputes may be resolved through mediation or arbitration as per Indian law.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-green-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
        </div>
        <p className="text-gray-700 mb-4">
          If you have any questions about these Terms and Conditions, please contact us:
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> legal@agriconnect.com</p>
          <p><strong>Phone:</strong> +91-80-1234-5678</p>
          <p><strong>Address:</strong> Agri-Connect Legal Department, Bengaluru, Karnataka, India</p>
        </div>
      </div>

      {/* Updates Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Terms Updates:</strong> We may update these Terms from time to time. Material changes will be 
          communicated through email or platform notifications. Continued use of our services after changes 
          constitutes acceptance of the updated Terms.
        </p>
      </div>
    </div>
  );
}
