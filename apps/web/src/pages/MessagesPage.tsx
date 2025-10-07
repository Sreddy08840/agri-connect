import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User as UserIcon, Loader2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  customer: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  farmer: {
    id: string;
    name: string;
    avatarUrl?: string;
    farmerProfile?: {
      businessName: string;
    };
  };
  product?: {
    id: string;
    name: string;
    images?: string;
  };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  }>;
  updatedAt: string;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadChats();
    loadUnreadCount();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chat/direct/list');
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/chat/direct/unread/count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const getProductImage = (images?: string) => {
    if (!images) return null;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed[0] : null;
    } catch {
      return null;
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const displayName = user?.role === 'CUSTOMER'
      ? (chat.farmer.farmerProfile?.businessName || chat.farmer.name)
      : chat.customer.name;
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-farmer-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-2xl">
            <MessageCircle className="h-8 w-8 text-farmer-green-700" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 overflow-hidden">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-farmer-beige-100 rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start a conversation by messaging a seller from a product page'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Browse Products
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-farmer-beige-200">
            {filteredChats.map((chat) => {
              const displayName = user?.role === 'CUSTOMER'
                ? (chat.farmer.farmerProfile?.businessName || chat.farmer.name)
                : chat.customer.name;
              const lastMessage = chat.messages[0];
              const productImage = chat.product ? getProductImage(chat.product.images) : null;
              const avatarUrl = user?.role === 'CUSTOMER' ? chat.farmer.avatarUrl : chat.customer.avatarUrl;

              return (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="p-4 hover:bg-farmer-beige-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-7 w-7 text-farmer-green-700" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-farmer-green-700 transition-colors">
                          {displayName}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {new Date(lastMessage.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      {chat.product && (
                        <div className="flex items-center space-x-2 mb-2">
                          {productImage && (
                            <img
                              src={productImage}
                              alt={chat.product.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <span className="text-xs text-gray-600 truncate">
                            About: {chat.product.name}
                          </span>
                        </div>
                      )}

                      {/* Last Message */}
                      {lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage.sender.id === user?.id ? 'You: ' : ''}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
