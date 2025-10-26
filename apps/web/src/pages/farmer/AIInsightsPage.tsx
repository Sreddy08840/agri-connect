import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getFarmerAnalytics, predictPrice, forecastSales, type FarmerAnalytics, type PriceOptimization, type SalesForecast } from '../../lib/api/ai';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Package, Star, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIInsightsPage() {
  const { user } = useAuthStore();
  const token = localStorage.getItem('accessToken');
  const [analytics, setAnalytics] = useState<FarmerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [priceOptimization, setPriceOptimization] = useState<PriceOptimization | null>(null);
  const [salesForecast, setSalesForecast] = useState<SalesForecast | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    if (token && user?.role === 'FARMER') {
      loadAnalytics();
    }
  }, [token, user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getFarmerAnalytics(token!);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handlePricePredict = async (productId: string) => {
    if (!productId) return;
    
    try {
      setLoadingPrice(true);
      const data = await predictPrice(token!, productId);
      setPriceOptimization(data);
      toast.success('Price optimization calculated!');
    } catch (error) {
      console.error('Failed to predict price:', error);
      toast.error('Failed to predict price');
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleForecast = async (productId: string) => {
    if (!productId) return;
    
    try {
      setLoadingForecast(true);
      const data = await forecastSales(token!, productId, 30);
      setSalesForecast(data);
      toast.success('Sales forecast generated!');
    } catch (error) {
      console.error('Failed to forecast sales:', error);
      toast.error('Failed to forecast sales');
    } finally {
      setLoadingForecast(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Insights Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{analytics?.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics?.totalOrders}
              </p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics?.totalProducts}
              </p>
            </div>
            <Activity className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics?.averageRating.toFixed(1)} ⭐
              </p>
            </div>
            <Star className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Revenue Trend (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.revenueTrend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Optimization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Smart Price Suggestion</h2>
          <p className="text-gray-600 mb-4">
            Get AI-powered price recommendations to maximize your revenue
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <input
              type="text"
              placeholder="Enter Product ID"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => handlePricePredict(selectedProduct)}
            disabled={!selectedProduct || loadingPrice}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPrice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Get Price Recommendation'
            )}
          </button>

          {priceOptimization && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Recommendation</h3>
              <p className="text-sm text-gray-700 mb-2">
                Current Price: <span className="font-bold">₹{priceOptimization.current_price}</span>
              </p>
              <p className="text-sm text-gray-700 mb-2">
                Recommended Price: <span className="font-bold text-green-600">₹{priceOptimization.recommended_price}</span>
              </p>
              <p className="text-sm text-gray-700">
                Expected Revenue Increase: <span className="font-bold text-green-600">
                  {priceOptimization.expected_revenue_increase.toFixed(1)}%
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Sales Forecast */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Forecast</h2>
          <p className="text-gray-600 mb-4">
            Predict demand for the next 30 days
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <input
              type="text"
              placeholder="Enter Product ID"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => handleForecast(selectedProduct)}
            disabled={!selectedProduct || loadingForecast}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingForecast ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Forecasting...
              </>
            ) : (
              'Generate Forecast'
            )}
          </button>

          {salesForecast && salesForecast.forecast.length > 0 && (
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesForecast.forecast.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="predicted_demand" fill="#3b82f6" name="Predicted Demand" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
