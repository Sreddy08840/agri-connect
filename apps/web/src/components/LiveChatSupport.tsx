import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Minimize2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface LiveChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChatSupport({ isOpen, onClose }: LiveChatSupportProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatRoomId = `support-${user?.id}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO connection
  useEffect(() => {
    if (!isOpen || !user) return;

    // Use VITE_SOCKET_URL if available, otherwise extract base URL from VITE_API_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080');
    console.log('🔌 Connecting to:', socketUrl);
    
    const socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Support chat connected - Socket ID:', socket.id);
      console.log('🔌 Connection status: ONLINE');
      setIsConnected(true);
      socket.emit('join-support-chat', { userId: user.id, userName: user.name, userRole: user.role });
      console.log('📤 Emitted join-support-chat for user:', user.name);
    });

    socket.on('disconnect', () => {
      console.log('❌ Support chat disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
    });

    socket.on('support:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socket.on('support:history', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('admin-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    return () => {
      socket.emit('leave-support-chat', { userId: user.id });
      socket.disconnect();
    };
  }, [isOpen, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Send attempt - Connected:', isConnected, 'Socket:', !!socketRef.current, 'Message:', newMessage.trim());
    
    if (!newMessage.trim() || isSending || !socketRef.current || !user) {
      console.log('❌ Send blocked - Message empty or not connected');
      return;
    }

    const messageData = {
      body: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      chatRoomId,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSending(true);
      console.log('📤 Sending message:', messageData);
      socketRef.current.emit('support:send-message', messageData);
      setNewMessage('');
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('user-typing', { userId: user.id, userName: user.name });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Live Support</h3>
              <p className="text-xs text-green-100">
                {isConnected ? '● Online' : '○ Connecting...'}
              </p>
              {!isConnected && (
                <p className="text-xs text-yellow-200 mt-1">
                  Establishing connection...
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div className="h-[440px] overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium">Welcome to Live Support!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Send a message and our support team will respond shortly.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const isAdmin = message.senderRole === 'ADMIN' || message.isAdmin;
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                              : isAdmin
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className={`text-xs font-medium mb-1 ${
                              isAdmin ? 'text-blue-100' : 'text-gray-600'
                            }`}>
                              {isAdmin ? '👨‍💼 Support Team' : message.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{message.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-green-100' : isAdmin ? 'text-blue-100' : 'text-gray-500'
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
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">Support team is typing...</p>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={isSending || !isConnected}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending || !isConnected}
                  className="p-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
