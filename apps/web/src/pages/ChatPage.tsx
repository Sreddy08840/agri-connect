import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, User as UserIcon, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
}

interface ChatInfo {
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
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat and messages
  useEffect(() => {
    if (!chatId) return;

    const loadChat = async () => {
      try {
        setIsLoading(true);
        const [messagesRes, chatsRes] = await Promise.all([
          api.get(`/chat/direct/${chatId}/messages`),
          api.get('/chat/direct/list'),
        ]);

        setMessages(messagesRes.data);
        const currentChat = chatsRes.data.find((c: any) => c.id === chatId);
        if (currentChat) {
          setChatInfo(currentChat);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId]);

  // Socket.IO connection
  useEffect(() => {
    if (!chatId || !user) return;

    // Use VITE_SOCKET_URL if available, otherwise extract base URL from VITE_API_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-chat-room', chatId);
      // Join user-specific room for notifications
      socket.emit(`join-${user.role.toLowerCase()}-room`, user.id);
    });

    socket.on('message:new', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socket.on('user-typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== user.id) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    });

    socket.on('user-stopped-typing', (data: { userId: string }) => {
      if (data.userId !== user.id) {
        setIsTyping(false);
        setTypingUser('');
      }
    });

    return () => {
      socket.emit('leave-chat-room', chatId);
      socket.disconnect();
    };
  }, [chatId, user]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketRef.current || !user || !chatId) return;

    socketRef.current.emit('typing-start', {
      chatId,
      userId: user.id,
      userName: user.name,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing-stop', { chatId, userId: user.id });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending) return;

    try {
      setIsSending(true);
      await api.post(`/chat/direct/${chatId}/messages`, {
        body: newMessage.trim(),
      });

      // Message will be added via Socket.IO event
      setNewMessage('');
      
      // Stop typing indicator
      if (socketRef.current && user) {
        socketRef.current.emit('typing-stop', { chatId, userId: user.id });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-farmer-green-600" />
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Chat not found</p>
        <button
          onClick={() => navigate('/messages')}
          className="mt-4 px-6 py-2 bg-farmer-green-600 text-white rounded-xl hover:bg-farmer-green-700 transition-colors"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  const otherUser = user?.role === 'CUSTOMER' ? chatInfo.farmer : chatInfo.customer;
  const displayName = user?.role === 'CUSTOMER' 
    ? (chatInfo.farmer.farmerProfile?.businessName || chatInfo.farmer.name)
    : chatInfo.customer.name;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 mb-6 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-farmer-beige-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3 flex-1">
            <div className="h-12 w-12 bg-gradient-to-br from-farmer-green-100 to-farmer-green-200 rounded-full flex items-center justify-center">
              {otherUser.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <UserIcon className="h-6 w-6 text-farmer-green-700" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg text-gray-900">{displayName}</h2>
              {chatInfo.product && (
                <p className="text-sm text-gray-600">About: {chatInfo.product.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-2xl shadow-card border border-farmer-beige-200 overflow-hidden">
        {/* Messages List */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-farmer-beige-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white'
                          : 'bg-white border border-farmer-beige-300 text-gray-900'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-medium mb-1 text-gray-600">
                          {message.sender.name}
                        </p>
                      )}
                      <p className="text-base leading-relaxed">{message.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="px-6 py-2 bg-farmer-beige-50 border-t border-farmer-beige-200">
            <p className="text-sm text-gray-600 italic">{typingUser} is typing...</p>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-farmer-beige-200">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border-2 border-farmer-beige-300 rounded-xl focus:ring-2 focus:ring-farmer-green-500 focus:border-farmer-green-500 transition-all duration-200"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-6 py-3 bg-gradient-to-r from-farmer-green-600 to-farmer-green-700 text-white rounded-xl hover:from-farmer-green-700 hover:to-farmer-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center space-x-2"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span className="font-medium">Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
