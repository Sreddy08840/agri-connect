/**
 * voice-ui.js
 * Handles UI interactions, mic button states, and visual feedback for voice AI.
 * Clean, reusable module for voice AI structure.
 */

class VoiceUIManager {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.listeners = new Set();
  }

  /**
   * Subscribe to state changes (useful for React/Vue/Vanilla JS integration)
   * @param {Function} callback 
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Returns unsubscribe function
  }

  /**
   * Notify all listeners of state changes
   */
  notify() {
    const state = this.getState();
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Get the current state of the Voice UI
   */
  getState() {
    return {
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      statusText: this.getStatusText()
    };
  }

  getStatusText() {
    if (this.isProcessing) return "Processing...";
    if (this.isListening) return "Listening...";
    return "Tap to speak";
  }

  /**
   * Update the listening state
   * @param {boolean} listening 
   */
  setListening(listening) {
    this.isListening = listening;
    if (listening) {
      this.isProcessing = false;
    }
    this.notify();
  }

  /**
   * Update the processing state
   * @param {boolean} processing 
   */
  setProcessing(processing) {
    this.isProcessing = processing;
    if (processing) {
      this.isListening = false;
    }
    this.notify();
  }

  /**
   * Helper to handle mic button click
   * This is where you'd connect speechService and aiHandler later
   */
  toggleMic() {
    if (this.isListening) {
      this.setListening(false);
      // Logic to stop speech recognition would go here
    } else {
      this.setListening(true);
      // Logic to start speech recognition would go here
    }
  }
}

export const voiceUI = new VoiceUIManager();
