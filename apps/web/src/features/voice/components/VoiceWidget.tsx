import React, { useEffect, useRef } from 'react';
import { Mic, Globe, X, Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { useVoiceAssistant, SUPPORTED_LANGUAGES } from '../hooks/useVoiceAssistant';

export const VoiceWidget: React.FC = () => {
  const { isActive, isConnecting, isPanelOpen, setIsPanelOpen, messages, startVoice, currentLang, changeLanguage, volumeLevel } = useVoiceAssistant();
  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* Chat Panel */}
      <div 
        className={`
          mb-6 w-[calc(100vw-3rem)] sm:w-96 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden pointer-events-auto
          transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform origin-bottom-right
          ${isPanelOpen ? 'scale-100 opacity-100 translate-y-0 rotate-0' : 'scale-75 opacity-0 translate-y-20 rotate-6 pointer-events-none'}
        `}
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}
      >
        {/* Header - Glassy Gradient */}
        <div className="bg-gradient-to-r from-emerald-600/90 to-green-600/90 backdrop-blur-md px-6 py-4 flex justify-between items-center text-white relative z-20">
          {/* Animated Background Sparkle */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20 animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0,rgba(255,255,255,0.4)_50%,transparent_100%)]"></div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner border border-white/30">
              <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight leading-tight">Krishi AI</h3>
              <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold">Voice Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl transition-all duration-300 border border-white/20 group"
              >
                <Globe className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
                <span className="font-medium">{currentLangObj.label}</span>
              </button>
              
              {/* Language Dropdown */}
              {showLangMenu && (
                <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden z-50 min-w-[160px] animate-in fade-in zoom-in duration-300">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-emerald-50 transition-all ${
                        currentLang === lang.code ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                      {currentLang === lang.code && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="text-white/80 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Messages - Subtle Pattern Background */}
        <div className="h-[400px] overflow-y-auto p-6 flex flex-col gap-4 bg-[#fcfdfd] relative scrollbar-hide">
          {/* Subtle watermark or pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
            <Sparkles className="w-64 h-64 text-emerald-900" />
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-200 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-white rounded-3xl flex items-center justify-center shadow-xl border border-emerald-100/50 relative">
                  <Mic className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-600 mb-1">
                  {currentLang === 'hi-IN' ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?' 
                    : currentLang === 'kn-IN' ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'
                    : 'Hello! How can I help you today?'}
                </p>
                <p className="text-xs opacity-60">
                  Try: "Add 50kg tomatoes" or "What is PM-KISAN?"
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[85%] rounded-[24px] px-5 py-3.5 text-sm shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white self-end rounded-br-none shadow-emerald-200/50' 
                      : 'bg-white text-gray-800 border border-gray-100 self-start rounded-bl-none shadow-gray-200/30'
                  }`}
                  style={{ transform: `scale(${1 + idx * 0.005})` }}
                >
                  <div className="flex items-center gap-2 mb-1 opacity-70">
                    {msg.role === 'user' ? <MessageSquare className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                       {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <div className="leading-relaxed font-medium">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {/* Dynamic Wave Visualization */}
          {isActive && (
             <div className="self-start bg-white rounded-2xl rounded-bl-none border border-emerald-100 p-4 shadow-lg shadow-emerald-100/50 animate-in fade-in slide-in-from-left-2 flex items-end gap-1.5 h-14">
               {[...Array(12)].map((_, i) => (
                 <div 
                  key={i}
                  className="w-1.5 bg-emerald-500 rounded-full" 
                  style={{ 
                    height: `${Math.max(10, volumeLevel * (100 + Math.random() * 50))}%`,
                    transition: 'height 0.1s ease-out',
                    opacity: 0.6 + (volumeLevel * 0.4)
                  }}
                 ></div>
               ))}
             </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
           <span>Krishi Vapi Engine v3.0</span>
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : isConnecting ? 'bg-yellow-400 animate-bounce' : 'bg-gray-300'}`}></div>
             <span>{isActive ? 'Live' : isConnecting ? 'Connecting' : 'Ready'}</span>
           </div>
        </div>
      </div>

      {/* Mic Button - 3D Effect */}
      <div className="relative pointer-events-auto">
        {/* Interactive Aura */}
        <div className={`
          absolute inset-[-20px] rounded-full transition-all duration-1000
          ${isActive ? 'bg-emerald-400/20 opacity-100 scale-125 blur-2xl' : 'opacity-0 scale-50 blur-none'}
        `}></div>
        
        <button
          onClick={startVoice}
          className={`
            relative group flex items-center justify-center
            w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)]
            bg-gradient-to-br from-emerald-400 to-emerald-600
            text-white overflow-hidden
            transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
            hover:scale-110 hover:-translate-y-2 hover:shadow-[0_25px_40px_-5px_rgba(16,185,129,0.5)]
            active:scale-95 active:translate-y-0
            focus:outline-none focus:ring-4 focus:ring-emerald-200/50
            ${isActive ? 'scale-105 shadow-[0_0_40px_rgba(16,185,129,0.6)]' : ''}
          `}
          aria-label="Start Voice Assistant"
        >
          {/* Inner Gloss */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-10deg] translate-y-[-50%] group-hover:translate-y-[-20%] transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col items-center">
            <Mic className={`w-7 h-7 sm:w-9 sm:h-9 ${isActive ? 'animate-pulse' : isConnecting ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">
              {isActive ? 'Stop' : isConnecting ? '...' : 'Talk'}
            </span>
          </div>

          {/* Progress ring/border for active state */}
          {isActive && (
            <div className="absolute inset-0 border-[3px] border-white/30 rounded-[28px] animate-spin-slow"></div>
          )}
        </button>

        {/* Small floating hint for first-time users */}
        {!isPanelOpen && !isActive && (
          <div className="absolute top-[-45px] right-0 bg-white px-3 py-1.5 rounded-xl shadow-xl border border-emerald-50 text-[10px] font-bold text-emerald-600 whitespace-nowrap animate-bounce cursor-default select-none uppercase tracking-wider">
            Need Help? Ask Krishi!
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes voice-wave {
          0%, 100% { height: 20%; }
          50% { height: 80%; }
        }
        .animate-voice-wave {
          animation: voice-wave 1.2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};
