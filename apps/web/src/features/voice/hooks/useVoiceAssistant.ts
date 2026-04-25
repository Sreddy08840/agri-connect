import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from '@vapi-ai/web';

// Hackathon Tip: Get these from https://dashboard.vapi.ai
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || 'your-vapi-public-key';
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || 'your-vapi-assistant-id';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export const useVoiceAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLang, setCurrentLang] = useState('en-IN');
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const navigate = useNavigate();

  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

    vapiRef.current.on('call-start', () => {
      setIsActive(true);
      setIsConnecting(false);
      setIsPanelOpen(true);
      console.log('Vapi Call Started');
    });

    vapiRef.current.on('call-end', () => {
      setIsActive(false);
      setIsConnecting(false);
      console.log('Vapi Call Ended');
    });

    vapiRef.current.on('message', async (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        addMessage(message.role === 'assistant' ? 'ai' : 'user', message.transcript);

        if (message.role === 'assistant') {
          handleAssistantResponse(message.transcript);
        }
      }

      // Handle Client-Side Tool Calling
      if (message.type === 'tool-calls') {
        const toolCall = message.toolCalls[0];
        if (toolCall.function.name === 'process_intent') {
          const args = toolCall.function.arguments;
          const userInput = typeof args === 'string' ? JSON.parse(args).user_input : args.user_input;
          
          try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:8080/api/voice/process', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ text: userInput, language: currentLang })
            });
            const data = await res.json();
            
            vapiRef.current?.send({
              type: 'tool-call-result',
              toolCallList: [
                {
                  toolCallId: toolCall.id,
                  result: data.message || (currentLang === 'hi-IN' ? 'मैंने आपका अनुरोध प्रोसेस कर दिया है।' : currentLang === 'kn-IN' ? 'ನಾನು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿದ್ದೇನೆ.' : 'I have processed the request.')
                }
              ]
            });
          } catch (err) {
            console.error('Local API error:', err);
            vapiRef.current?.send({
              type: 'tool-call-result',
              toolCallList: [{ 
                toolCallId: toolCall.id, 
                result: currentLang === 'hi-IN' ? 'सिस्टम से कनेक्ट करने में त्रुटि हुई।' : currentLang === 'kn-IN' ? 'ಸಿಸ್ಟಮ್‌ಗೆ ಸಂಪರ್ಕಿಸುವಲ್ಲಿ ದೋಷ ಉಂಟಾಗಿದೆ.' : 'I encountered an error connecting to the system.' 
              }]
            });
          }
        }
      }
    });

    vapiRef.current.on('volume-level', (level) => {
      setVolumeLevel(level);
    });

    vapiRef.current.on('error', (error) => {
      console.error('Vapi Error:', error);
      setIsActive(false);
      setIsConnecting(false);
    });

    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  const addMessage = useCallback((role: 'user' | 'ai', text: string) => {
    setMessages((prev) => {
      // Avoid duplicate final transcripts if they come in fast
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      return [...prev, { role, text }];
    });
  }, []);

  const changeLanguage = useCallback((langCode: string) => {
    setCurrentLang(langCode);
    // Vapi might need assistant update for language, butnova-2 handles it well
  }, []);

  const handleAssistantResponse = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('product') || lowerText.includes('list')) {
      // Example: logic to navigate if AI mentioned listing
    }
  }, []);

  const startVoice = useCallback(async () => {
    if (isActive) {
      vapiRef.current?.stop();
      return;
    }

    setIsConnecting(true);
    setIsPanelOpen(true);

    try {
      const langMap: Record<string, string> = {
        'en-IN': 'en-IN',
        'hi-IN': 'hi',
        'kn-IN': 'kn'
      };
      
      const vapiLang = langMap[currentLang] || 'en-IN';
      
      // Select appropriate Azure Voice for the language
      let voiceId = "en-IN-NeerjaNeural";
      if (currentLang === 'hi-IN') voiceId = "hi-IN-SwaraNeural";
      else if (currentLang === 'kn-IN') voiceId = "kn-IN-SapnaNeural";
      
      // Use an inline Assistant configuration. 
      // This bypasses the Vapi Dashboard entirely, ensuring that leftover webhooks 
      // or misconfigured settings do not crash the call or eject the user!
      await vapiRef.current?.start({
        name: "Krishi AI Assistant",
        firstMessage: currentLang === 'hi-IN' ? 'नमस्ते! मैं कृषि हूँ। मैं आपकी कैसे मदद कर सकती हूँ?' 
                    : currentLang === 'kn-IN' ? 'ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' 
                    : 'Hello! I am Krishi. How can I help you today?',
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: vapiLang
        },
        voice: {
          provider: "azure",
          voiceId: voiceId
        },
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          systemPrompt: `You are Krishi, an AI assistant for Agri-Connect. The user speaks ${currentLang === 'hi-IN' ? 'Hindi' : currentLang === 'kn-IN' ? 'Kannada' : 'English'}. 
You MUST respond EXCLUSIVELY in this language! 
Whenever you call the 'process_intent' tool, you will receive a result. You MUST translate that result into the user's language (${currentLang === 'hi-IN' ? 'Hindi' : currentLang === 'kn-IN' ? 'Kannada' : 'English'}) before speaking it. 
Do NOT speak English if the user has selected Hindi or Kannada.`,
          tools: [
            {
              type: "function",
              async: false,
              function: {
                name: "process_intent",
                description: "Handles farming queries, adding products, checking orders, price prediction.",
                parameters: {
                  type: "object",
                  properties: {
                    user_input: {
                      type: "string",
                      description: "The exact input phrase from the user."
                    }
                  },
                  required: ["user_input"]
                }
              }
            }
          ]
        }
      });
    } catch (err) {
      console.error('Failed to start Vapi call:', err);
      setIsConnecting(false);
    }
  }, [isActive, currentLang]);

  return {
    isActive,
    isConnecting,
    isPanelOpen,
    setIsPanelOpen,
    messages,
    startVoice,
    currentLang,
    changeLanguage,
    volumeLevel
  };
};

