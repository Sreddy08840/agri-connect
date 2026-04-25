/**
 * speech.js
 * Handles speech-to-text (STT) and text-to-speech (TTS) functionalities.
 * Supports multiple languages: English, Hindi, Kannada.
 */

// Supported languages for voice
export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧', ttsLang: 'en-IN' },
  { code: 'hi-IN', label: 'हिन्दी',  flag: '🇮🇳', ttsLang: 'hi-IN' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ',   flag: '🇮🇳', ttsLang: 'kn-IN' },
];

class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentLanguage = 'en-IN'; // Default to Indian English
  }

  // Set the active language
  setLanguage(langCode) {
    this.currentLanguage = langCode;
    // Re-initialize STT with the new language
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  // Get current language
  getLanguage() {
    return this.currentLanguage;
  }

  // Initialize Speech-to-Text
  initSTT(language) {
    const lang = language || this.currentLanguage;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = lang;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }

  // Main function requested to start voice recognition
  startVoiceRecognition(onResult, onError, onEnd) {
    // Always re-init to pick up any language changes
    this.initSTT(this.currentLanguage);

    if (!this.recognition) {
      console.error("Speech Recognition is not available.");
      return;
    }

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log(`🎙️ [${this.currentLanguage}] Recognized:`, transcript);
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error("🎙️ Speech Recognition Error:", event.error);
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      console.log("🎙️ Speech Recognition Ended");
      if (onEnd) onEnd();
    };

    console.log(`🎙️ Listening in ${this.currentLanguage}...`);
    this.recognition.start();
  }

  // Stop listening
  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // Text-to-Speech playback with multilingual support
  speakResponse(text, language) {
    if (!this.synthesis) {
      console.warn("Speech Synthesis API not supported.");
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const lang = language || this.currentLanguage;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for clarity

    // Try to find a voice that matches the language
    const voices = this.synthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === lang) 
      || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    this.synthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
