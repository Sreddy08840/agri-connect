import React from 'react';

interface VoiceWaveProps {
  isListening: boolean;
}

export default function VoiceWave({ isListening }: VoiceWaveProps) {
  if (!isListening) return null;
  
  return (
    <div className="flex items-center gap-1 h-5 mx-1">
      <div className="w-1 h-full bg-green-500 rounded-full animate-wave" style={{ animationDelay: '0s' }}></div>
      <div className="w-1 h-full bg-green-500 rounded-full animate-wave" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1 h-full bg-green-500 rounded-full animate-wave" style={{ animationDelay: '0.4s' }}></div>
      <div className="w-1 h-full bg-green-500 rounded-full animate-wave" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1 h-full bg-green-500 rounded-full animate-wave" style={{ animationDelay: '0s' }}></div>
    </div>
  );
}
