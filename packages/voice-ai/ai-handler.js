/**
 * ai-handler.js
 * Handles intent detection and AI responses based on transcribed text.
 * Clean, reusable module for voice AI structure.
 */

class AIHandler {
  constructor() {
    this.context = {};
  }

  /**
   * Process user input text and return the detected intent as JSON
   * @param {string} text - The transcribed speech text
   * @returns {Object} - JSON object containing the intent and extracted data
   */
  processCommand(text) {
    if (!text) {
      return { intent: "unknown" };
    }

    try {
      const intent = this.detectIntent(text);
      let data = null;

      if (intent === 'add_product') {
        data = this.extractProductEntities(text);
      }
      
      // Return intent as JSON
      return {
        intent: intent,
        data: data
      };
    } catch (error) {
      console.error("Error processing AI command:", error);
      return {
        intent: "error"
      };
    }
  }

  /**
   * Simple regex/keyword-based intent detection
   * @param {string} text 
   * @returns {string} The matched intent
   */
  detectIntent(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('add') || lowerText.includes('create product')) {
      return 'add_product';
    }
    
    if (lowerText.includes('show products') || lowerText.includes('my products')) {
      return 'show_products';
    }
    
    if (lowerText.includes('show orders') || lowerText.includes('my orders')) {
      return 'show_orders';
    }
    
    if (lowerText.includes('price') || lowerText.includes('cost')) {
      return 'price';
    }

    return 'unknown';
  }

  /**
   * Extract product name, quantity, and unit from speech text
   * Example: "Add 50 kg tomatoes" -> { product: "tomatoes", quantity: 50, unit: "kg" }
   * @param {string} text
   * @returns {Object} Extracted entities
   */
  extractProductEntities(text) {
    const lowerText = text.toLowerCase();
    
    // Regex explanation:
    // match "add" or "create" optionally followed by "product"
    // match optional quantity (\d+)
    // match optional unit (kg|g|lbs|tons|boxes|pieces|units|grams|liters|ml)
    // match the rest as product name
    const match = lowerText.match(/(?:add|create)\s+(?:product\s+)?(\d+(?:\.\d+)?)?\s*(kg|g|lbs|tons|boxes|pieces|units|grams|liters|ml)?\s*(.+)/i);
    
    if (match) {
      let product = match[3] ? match[3].trim() : "";
      // Remove trailing filler words if they somehow got stuck (very basic NLP cleanup)
      product = product.replace(/please|now|fast/g, '').trim();
      
      return {
        product: product,
        quantity: match[1] ? parseFloat(match[1]) : null,
        unit: match[2] ? match[2].trim() : null
      };
    }
    
    return null;
  }
}

export const aiHandler = new AIHandler();
