/**
 * Chat/RAG Client for AgriConnect ML Service
 * 
 * Provides integration with the RAG-enabled chatbot endpoint.
 */

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Query the chatbot with semantic search
 * 
 * @param {string} query - User query
 * @param {Object} options - Query options
 * @param {string} options.userId - User ID (optional, anonymized)
 * @param {number} options.topK - Number of documents to retrieve (default: 5)
 * @param {boolean} options.useLlm - Use LLM for answer generation (default: false)
 * @returns {Promise<Object>} Chat response
 */
async function queryChatbot(query, options = {}) {
  try {
    const {
      userId = null,
      topK = 5,
      useLlm = false
    } = options;

    const response = await axios.post(
      `${ML_SERVICE_URL}/chat/query`,
      {
        query,
        user_id: userId,
        top_k: topK,
        use_llm: useLlm
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Chat query error:', error.message);
    
    if (error.response) {
      // ML service returned an error
      return {
        success: false,
        error: error.response.data.detail || 'Chat service error',
        status: error.response.status
      };
    } else if (error.code === 'ECONNREFUSED') {
      // ML service not running
      return {
        success: false,
        error: 'Chat service unavailable. Please ensure ML service is running.',
        status: 503
      };
    } else {
      // Other error
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }
}

/**
 * Check chat service health
 * 
 * @returns {Promise<Object>} Health status
 */
async function checkChatHealth() {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/chat/health`,
      { timeout: 5000 }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get chat service statistics
 * 
 * @returns {Promise<Object>} Statistics
 */
async function getChatStats() {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/chat/stats`,
      { timeout: 5000 }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format chat response for frontend display
 * 
 * @param {Object} chatResponse - Raw chat response from ML service
 * @returns {Object} Formatted response for frontend
 */
function formatChatResponse(chatResponse) {
  if (!chatResponse.success) {
    return {
      message: chatResponse.error || 'Sorry, I encountered an error. Please try again.',
      sources: [],
      confidence: 0,
      error: true
    };
  }

  const { data } = chatResponse;

  return {
    message: data.answer,
    sources: data.retrieved_documents.map(doc => ({
      id: doc.doc_id,
      text: doc.text.substring(0, 200) + (doc.text.length > 200 ? '...' : ''),
      score: doc.score,
      type: doc.metadata.type,
      title: doc.metadata.title || doc.metadata.question || 'Source'
    })),
    confidence: data.confidence,
    method: data.method,
    responseTime: data.response_time_ms,
    error: false
  };
}

/**
 * Example usage in Express route
 * 
 * app.post('/api/chat', async (req, res) => {
 *   const { query, userId } = req.body;
 *   
 *   const response = await queryChatbot(query, { userId });
 *   const formatted = formatChatResponse(response);
 *   
 *   res.json(formatted);
 * });
 */

module.exports = {
  queryChatbot,
  checkChatHealth,
  getChatStats,
  formatChatResponse
};
