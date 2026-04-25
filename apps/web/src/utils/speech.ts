export const startVoiceRecognition = (
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      if (onError) onError('Voice recognition is not supported in this browser.');
      reject(new Error('Voice recognition is not supported'));
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      if (onStart) onStart();
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Recognized speech:', transcript);
      resolve(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      const errorMsg = event.error === 'not-allowed' ? 'Microphone access denied' : 'Voice recognition failed';
      if (onError) onError(errorMsg);
      reject(new Error(errorMsg));
    };
    
    recognition.onend = () => {
      if (onEnd) onEnd();
      // If it ends without resolving (e.g. timeout), we could resolve with empty or let it hang,
      // but usually we resolve with empty string if no result was caught.
      // However, we only resolve in onresult. Let's just resolve empty if it hasn't resolved.
      // Actually, standard behavior is fine, the promise might just remain unresolved or we reject.
      resolve('');
    };
    
    recognition.start();
  });
};

export const speakResponse = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech is not supported in this browser.');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
};
