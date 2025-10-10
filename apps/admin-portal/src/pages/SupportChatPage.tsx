import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id?: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface ActiveChat {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage?: string;
  unreadCount: number;
  isActive: boolean;
}

export default function SupportChatPage() {
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  // Socket.IO connection
  useEffect(() => {
    // Use VITE_SOCKET_URL if available, otherwise extract base URL from VITE_API_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080');
    console.log('🔌 Admin connecting to:', socketUrl);
    
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
      console.log('Admin support chat connected');
      setIsConnected(true);
      socket.emit('admin-join-support');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // New user joined support
    socket.on('support:user-joined', (data: ActiveChat) => {
      setActiveChats((prev) => {
        const existing = prev.find((c) => c.userId === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.userId === data.userId ? { ...c, isActive: true } : c
          );
        }
        return [...prev, { ...data, unreadCount: 0, isActive: true }];
      });
    });

    // User left support
    socket.on('support:user-left', (data: { userId: string }) => {
      setActiveChats((prev) =>
        prev.map((c) =>
          c.userId === data.userId ? { ...c, isActive: false } : c
        )
      );
    });

    // New message received
    socket.on('support:message', (message: Message) => {
      const chatId = `support-${message.senderId}`;
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));

      // Update last message in active chats
      setActiveChats((prev) =>
        prev.map((c) =>
          c.userId === message.senderId
            ? {
                ...c,
                lastMessage: message.body,
                unreadCount: selectedChat === chatId ? 0 : c.unreadCount + 1,
              }
            : c
        )
      );
    });

    // Active chats list
    socket.on('support:active-chats', (chats: ActiveChat[]) => {
      setActiveChats(chats);
    });

    // Chat history
    socket.on('support:chat-history', (data: { userId: string; messages: Message[] }) => {
      const chatId = `support-${data.userId}`;
      setMessages((prev) => ({
        ...prev,
        [chatId]: data.messages,
      }));
    });

    return () => {
      socket.emit('admin-leave-support');
      socket.disconnect();
    };
  }, [selectedChat]);

  const handleSelectChat = (userId: string) => {
    const chatId = `support-${userId}`;
    setSelectedChat(chatId);
    
    // Request chat history
    if (socketRef.current) {
      socketRef.current.emit('admin-request-history', { userId });
    }

    // Mark as read
    setActiveChats((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !socketRef.current || !selectedChat) return;

    const userId = selectedChat.replace('support-', '');
    const messageData: Message = {
      body: newMessage.trim(),
      senderId: 'admin',
      senderName: 'Support Team',
      senderRole: 'ADMIN',
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };

    try {
      setIsSending(true);
      socketRef.current.emit('admin-send-message', {
        userId,
        message: messageData,
      });
      
      // Add to local messages
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), messageData],
      }));
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const selectedChatData = activeChats.find(
    (c) => selectedChat === `support-${c.userId}`
  );

  return (
    <div className="h-[calc(100vh-120px)] flex bg-gray-50">
      {/* Sidebar - Active Chats */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Support Chats</h2>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {activeChats.filter((c) => c.isActive).length} active conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No active chats</p>
              <p className="text-sm text-gray-500 mt-1">
                Waiting for users to start conversations
              </p>
            </div>
          ) : (
            activeChats.map((chat) => (
              <button
                key={chat.userId}
                onClick={() => handleSelectChat(chat.userId)}
                className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                  selectedChat === `support-${chat.userId}` ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-700" />
                    </div>
                    {chat.isActive && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {chat.userName}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 capitalize">{chat.userRole.toLowerCase()}</p>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat && selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedChatData.userName}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedChatData.userRole.toLowerCase()} •{' '}
                      {selectedChatData.isActive ? (
                        <span className="text-green-600">● Online</span>
                      ) : (
                        <span className="text-gray-500">○ Offline</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectChat(selectedChatData.userId)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh chat"
                >
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {(!messages[selectedChat] || messages[selectedChat].length === 0) ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages[selectedChat].map((message, index) => {
                  const isAdmin = message.senderRole === 'ADMIN' || message.isAdmin;
                  return (
                    <div
                      key={index}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isAdmin
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          {!isAdmin && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {message.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{message.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isAdmin ? 'text-blue-100' : 'text-gray-500'
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

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={isSending || !isConnected}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending || !isConnected}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-500 mt-1">
                Choose a chat from the sidebar to start responding
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
