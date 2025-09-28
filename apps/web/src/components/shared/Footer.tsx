import { Mail, MapPin, Globe, Facebook, MessageCircle, Phone, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Footer() {
  const { user } = useAuthStore();
  
  return (
    <footer className="bg-[#111] text-gray-300 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Sign In Section for Non-authenticated Users */}
        {!user && (
          <div className="text-center mb-8 py-6 border-b border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4">Ready to get started?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/login" 
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Link>
              <span className="text-gray-400">or</span>
              <Link 
                to="/register" 
                className="inline-flex items-center px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-green-600 flex items-center justify-center text-white font-bold">AC</div>
              <span className="text-lg font-semibold text-white">Agri Connect</span>
            </div>
            <p className="text-sm text-gray-400 leading-6">
              Empowering Karnataka farmers with technology-driven trading solutions.
              Connect, trade, and grow with Agri Connect.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><Facebook className="h-4 w-4"/></a>
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><MessageCircle className="h-4 w-4"/></a>
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><Phone className="h-4 w-4"/></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white" href="/support/help-center">Help Center</a></li>
              <li><a className="hover:text-white" href="/support/privacy-policy">Privacy Policy</a></li>
              <li><a className="hover:text-white" href="/support/terms-conditions">Terms & Conditions</a></li>
              <li><a className="hover:text-white" href="/support/faq">FAQ</a></li>
              <li><a className="hover:text-white" href="/support/contact">Contact Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact Info</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> tech.agriconnect@gmail.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Bengaluru, Karnataka</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4"/> हिंदी / ಕನ್ನಡ / English</li>
            </ul>
          </div>
        </div>

        <hr className="my-6 border-gray-800" />
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <span>© 2025 Agri Connect. All rights reserved.</span>
          <span className="mt-2 md:mt-0">Empowering Karnataka Farmers</span>
        </div>
      </div>
    </footer>
  );
}
