import { Outlet, Link } from 'react-router-dom';
import { Tractor } from 'lucide-react';

export default function FarmerAuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Simple Farmer-Only Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Farmer Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Tractor className="h-8 w-8 text-green-600" />
                <div>
                  <span className="text-2xl font-bold text-green-600">Agri-Connect</span>
                  <span className="block text-xs text-green-500 -mt-1">Farmer Portal</span>
                </div>
              </Link>
            </div>

            {/* Simple Navigation - Farmer Only */}
            <nav className="flex items-center space-x-6">
              <Link 
                to="/farmer/login" 
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Farmer Login
              </Link>
              <Link 
                to="/farmer/register" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Join as Farmer
              </Link>
              <Link 
                to="/" 
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Main Site
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Simple Farmer Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-green-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 Agri-Connect Farmer Portal. Connecting farmers directly with customers.
            </p>
            <div className="mt-2 flex justify-center space-x-6">
              <Link to="/support/help-center" className="text-xs text-green-600 hover:text-green-700">
                Help Center
              </Link>
              <Link to="/support/contact" className="text-xs text-green-600 hover:text-green-700">
                Contact Support
              </Link>
              <Link to="/support/terms-conditions" className="text-xs text-green-600 hover:text-green-700">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
