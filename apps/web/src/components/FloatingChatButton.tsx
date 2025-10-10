import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import LiveChatSupport from './LiveChatSupport';
import { useAuthStore } from '../stores/authStore';

export default function FloatingChatButton() {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuthStore();

  // Only show for logged-in users
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open live chat"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          
          {/* Pulse animation */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
          
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Need help? Chat with us!
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </button>
      )}

      {/* Live Chat Component */}
      <LiveChatSupport 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
}
