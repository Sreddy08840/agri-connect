import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getAIResponse(prompt: string) {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (groqKey) {
    try {
      console.log('Using Groq AI...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        return data.choices[0].message.content;
      }
      console.error('Groq API error:', response.status, data);
    } catch (err) {
      console.error('Groq failed, falling back to Gemini:', err);
    }
  }

  const xaiKey = process.env.XAI_API_KEY;
  
  if (xaiKey && xaiKey !== 'your_grok_api_key_here') {
    try {
      console.log('Using Grok AI...');
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        return data.choices[0].message.content;
      }
      console.error('Grok API error:', response.status, data);
      // If Grok specifically returns a quota/credit error, throw it so the handler catches it
      if (data.error && data.error.includes('credits')) {
        throw new Error('Grok quota exceeded: ' + data.error);
      }
    } catch (err) {
      console.error('Grok failed, falling back to Gemini:', err);
    }
  }

  // Fallback to Gemini
  console.log('Using Gemini AI...');
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

router.post('/process', async (req, res) => {
  try {
    const { text, userId, language } = req.body;
    const userLang = language || 'en-IN';

    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const prompt = `
You are a MULTILINGUAL AI assistant for an agricultural supply chain platform called Agri-Connect.
You understand and respond in English, Hindi (हिन्दी), and Kannada (ಕನ್ನಡ).
The user is currently speaking in language code: "${userLang}".

Analyze the following user input and determine the intent and extract any relevant entities.
The input may be in English, Hindi, or Kannada — understand all three.

Allowed Intents:
- "add_product": User wants to add a new product to sell.
- "search_product": User wants to search for products to buy or check prices.
- "get_orders": User wants to check their order status or sales.
- "ask_question": User is asking a general question or needs help.
- "get_recommendations": User is asking for product recommendations or what to buy.
- "predict_price": User is asking for the optimal or best price for a specific product they own.
- "forecast_sales": User is asking to forecast or predict sales for a specific product they own.

Extract any relevant entities. If the user is adding or searching for a product, ensure you extract the following properties into the entities object:
- "name": string (capitalized product name in ENGLISH, e.g., "Tomato" even if user said "टमाटर" or "ಟೊಮ್ಯಾಟೊ")
- "stockQty": number (quantity, e.g., 50)
- "unit": string (e.g., "kg", "g", "l", "pc")
- "price": number (price in rupees, e.g., 30)

Return strictly in JSON format matching this schema:
{
  "intent": "string (one of the allowed intents)",
  "detectedLanguage": "string (en-IN, hi-IN, or kn-IN)",
  "entities": {
    "name": "string",
    "stockQty": "number",
    "unit": "string",
    "price": "number"
  }
}

If a specific entity is not mentioned in the text, you may omit it from the entities object.

User Input: "${text}"
`;

    const responseText = await getAIResponse(prompt);
    
    // Extract JSON block if the model wraps it in markdown
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || responseText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
    
    let parsedData = { intent: "ask_question", entities: {} };
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse Gemini output:', jsonStr);
    }

    let answer = null;
    
    // If it's a general question, use Qdrant RAG to provide an answer
    if (parsedData.intent === 'ask_question') {
      try {
        const { searchKnowledge } = await import('../services/qdrant');
        const results = await searchKnowledge(text, 3);
        
        let context = '';
        if (results && results.length > 0) {
          context = results.map(r => r.payload?.content).join('\n\n');
        }

        const responseLang = parsedData.detectedLanguage || userLang;
        const langInstruction = responseLang === 'hi-IN' ? 'Respond in Hindi (हिन्दी).' 
          : responseLang === 'kn-IN' ? 'Respond in Kannada (ಕನ್ನಡ).' 
          : 'Respond in English.';

        const ragPrompt = `
You are an expert agricultural assistant. Answer the user's question using ONLY the provided context. 
If the context doesn't contain the answer, say you don't have enough information.
${langInstruction}

Context:
${context}

User Question: "${text}"
`;
        const ragResult = await getAIResponse(ragPrompt);
        answer = ragResult;
      } catch (ragError) {
        console.error('RAG process failed:', ragError);
        answer = "I'm currently unable to access my knowledge base. Please try again later.";
      }
    }
    
    // If it's a product upload, hit our own products API
    if (parsedData.intent === 'add_product') {
      try {
        const { prisma } = await import('../config/database');
        
        // Find a category or use a fallback
        let category = await prisma.category.findFirst({
          where: { name: { contains: parsedData.entities.name } }
        });
        if (!category) {
          category = await prisma.category.findFirst();
        }

        const productPayload = {
          name: parsedData.entities.name || 'Unknown Product',
          price: Number(parsedData.entities.price) || 0,
          unit: parsedData.entities.unit || 'kg',
          stockQty: Number(parsedData.entities.stockQty) || 0,
          minOrderQty: 1,
          categoryId: category?.id,
          description: 'Added via Voice Assistant'
        };

        const token = req.headers.authorization;
        if (!token) {
           return res.status(401).json({ error: 'Unauthorized: missing token for product upload' });
        }

        const port = process.env.PORT || 8080;
        const response = await fetch(`http://localhost:${port}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify(productPayload)
        });

        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.error || 'Failed to create product via API');
        }
        
        answer = `I have successfully listed ${productPayload.stockQty} ${productPayload.unit} of ${productPayload.name} for ${productPayload.price} rupees.`;
        parsedData.entities.createdProduct = data;

      } catch (addProductError) {
        console.error('Add product process failed:', addProductError);
        answer = "I'm sorry, I encountered an error while trying to list your product. Please make sure you are logged in as a Farmer.";
      }
    }

    // If it's a product search, hit our own products API
    if (parsedData.intent === 'search_product') {
      try {
        const queryText = parsedData.entities.name || text;
        const port = process.env.PORT || 8080;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        
        const response = await fetch(`${baseUrl}/api/products?q=${encodeURIComponent(queryText)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.error || 'Failed to search products via API');
        }
        
        const productsCount = data.products?.length || 0;
        answer = `I found ${productsCount} products matching your search for "${queryText}".`;
        parsedData.entities.searchResults = data.products || [];

      } catch (searchError) {
        console.error('Search product process failed:', searchError);
        answer = "I'm sorry, I encountered an error while searching for products. Please try again.";
      }
    }

    // If it's an order tracking request, hit our own orders API
    if (parsedData.intent === 'get_orders') {
      try {
        const port = process.env.PORT || 8080;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const token = req.headers.authorization;
        
        if (!token) {
           return res.status(401).json({ error: 'Unauthorized: missing token for order tracking' });
        }

        const response = await fetch(`${baseUrl}/api/orders/my`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.error || 'Failed to fetch orders via API');
        }
        
        const ordersCount = data.orders?.length || 0;
        if (ordersCount === 0) {
          answer = "You don't have any recent orders.";
        } else {
          const latestOrder = data.orders[0];
          answer = `You have ${ordersCount} recent orders. Your latest order is currently ${latestOrder.status}.`;
        }
        parsedData.entities.orderData = data.orders || [];

      } catch (getOrdersError) {
        console.error('Get orders process failed:', getOrdersError);
        answer = "I'm sorry, I encountered an error while retrieving your orders. Please ensure you are logged in.";
      }
    }

    // ============ ML INTEGRATION ============

    if (parsedData.intent === 'get_recommendations') {
      try {
        const port = process.env.PORT || 8080;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const token = req.headers.authorization;
        
        if (!token) throw new Error('Unauthorized');

        const response = await fetch(`${baseUrl}/api/ai/recommendations`, {
          method: 'GET',
          headers: { 'Authorization': token }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const count = data.count || 0;
        if (count > 0) {
          const topProduct = data.items[0].name;
          answer = `I found ${count} recommendations for you. Based on the data, you might really like ${topProduct}!`;
        } else {
          answer = "I don't have enough data to make recommendations yet.";
        }
        parsedData.entities.recommendations = data.items || [];
      } catch (err) {
        console.error('Recommendations error:', err);
        answer = "I couldn't fetch recommendations right now.";
      }
    }

    if (parsedData.intent === 'predict_price' || parsedData.intent === 'forecast_sales') {
      try {
        const port = process.env.PORT || 8080;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const token = req.headers.authorization;
        
        if (!token) throw new Error('Unauthorized');

        // Resolve product name to productId
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret') as any;
        const { prisma } = await import('../config/database');
        
        const productName = parsedData.entities.name || '';
        const product = await prisma.product.findFirst({
          where: {
            farmerId: decoded.userId,
            name: { contains: productName }
          }
        });

        if (!product) {
          answer = `I couldn't find a product named "${productName}" in your catalog.`;
        } else {
          if (parsedData.intent === 'predict_price') {
             const currentPrice = Number(product.price);
             const minBound = currentPrice * 0.8;
             const maxBound = currentPrice * 1.5;

             const response = await fetch(`${baseUrl}/api/ai/price-predict`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': token },
               body: JSON.stringify({ productId: product.id, priceRangeMin: minBound, priceRangeMax: maxBound, numSamples: 10 })
             });
             const data = await response.json();
             if (!response.ok) throw new Error(data.error);
             
             answer = `The optimal predicted price for your ${product.name} is ₹${Math.round(data.optimalPrice)}.`;
             parsedData.entities.prediction = data;
          } else {
             const response = await fetch(`${baseUrl}/api/ai/sales-forecast`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': token },
               body: JSON.stringify({ productId: product.id, days: 30 })
             });
             const data = await response.json();
             if (!response.ok) throw new Error(data.error);

             answer = `I forecast you will sell ${Math.round(data.forecastedSales)} units of ${product.name} over the next 30 days. The trend is currently ${data.trend}.`;
             parsedData.entities.forecast = data;
          }
        }
      } catch (err) {
        console.error('ML process failed:', err);
        answer = "I encountered an error trying to run the AI model. Please try again.";
      }
    }

    // Provide a standardized response payload for Vapi/TTS
    const fallbackMessage = "I have processed your request.";
    let finalMessage = answer || fallbackMessage;

    // Translate hardcoded English responses to the user's selected language
    if (userLang !== 'en-IN' && parsedData.intent !== 'ask_question') {
      const translatePrompt = `You are a translator. Translate the following text to ${userLang === 'hi-IN' ? 'Hindi' : 'Kannada'}. 
Do not add any conversational filler, quotes, or explanations. Only output the exact translated text.

Text to translate:
${finalMessage}`;
      try {
        const translated = await getAIResponse(translatePrompt);
        if (translated) {
          finalMessage = translated.replace(/^["']|["']$/g, '').trim(); // Remove any quotes the LLM might add
        }
      } catch (e) {
        console.error('Translation failed', e);
      }
    }

    res.status(200).json({ 
      message: finalMessage,
      data: parsedData,
      speak: true,
      language: parsedData.detectedLanguage || userLang
    });
  } catch (error: any) {
    console.error('Error processing voice:', error);
    
    // Handle Gemini rate limit errors gracefully
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      return res.status(429).json({ 
        message: 'The AI service is temporarily busy. Please wait a moment and try again.',
        speak: true,
        error: 'rate_limit' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ VAPI WEBHOOK ============

/**
 * POST /api/voice/vapi-webhook
 * Handle incoming webhooks from Vapi.ai
 */
router.post('/vapi-webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('Vapi Webhook Received Type:', payload.message?.type || 'unknown');

    // 1. Handle ASSISTANT REQUEST (Server URL mode)
    // This is called when Vapi needs to know which assistant to use
    if (payload.message?.type === 'assistant-request') {
      const assistant = {
        name: "Krishi AI Assistant",
        firstMessage: "Namaste! I am Krishi, your agricultural AI assistant. How can I help you today?",
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-IN",
        },
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are Krishi, a helpful agricultural assistant for Agri-Connect. 
              You help farmers list products, check orders, and answer farming questions.
              Always be polite and professional. Use a friendly tone.
              You have access to tools to help the user.`
            }
          ],
          // We can also define tools here if using Vapi's tool-calling
        },
        voice: {
          provider: "11labs",
          voiceId: "sarah", // Or a suitable Indian-accented voice
        }
      };
      return res.status(201).json({ assistant });
    }

    // 2. Handle TRANSCRIPT or TOOL CALL (from Vapi)
    let text = '';
    let userId = null;

    if (payload.message?.type === 'tool-calls') {
      const toolCall = payload.message.toolCalls[0];
      if (toolCall.function.name === 'process_intent') {
        const args = toolCall.function.arguments;
        text = typeof args === 'string' ? JSON.parse(args).user_input : args.user_input;
      }
    } else if (payload.message?.type === 'transcript' && payload.message?.transcriptType === 'final') {
      text = payload.message.transcript;
    } else if (payload.message?.type === 'assistant-request') {
      text = payload.message.content;
    } else if (payload.request?.query) {
       text = payload.request.query;
    }

    if (!text) {
      // If it's a tool call but missing text, just return empty result to prevent stalling
      if (payload.message?.type === 'tool-calls') {
         return res.status(200).json({ results: [{ toolCallId: payload.message.toolCalls[0].id, result: "I could not understand." }] });
      }
      return res.status(200).json({ customerResponse: "Listening..." });
    }

    // 3. Process Intent (Reuse our existing logic)
    const port = process.env.PORT || 8080;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://localhost:${port}`;
    
    const callLanguage = payload.message?.call?.assistantOverrides?.transcriber?.language || 'en-IN';
    const language = callLanguage === 'hi' ? 'hi-IN' : callLanguage === 'kn' ? 'kn-IN' : 'en-IN';

    const procResponse = await fetch(`${baseUrl}/api/voice/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId, language })
    });

    const procData = await procResponse.json();

    // 4. Respond to Vapi in the correct format depending on the payload type
    if (payload.message?.type === 'tool-calls') {
      return res.status(200).json({
        results: [{
          toolCallId: payload.message.toolCalls[0].id,
          result: procData.message || "I've processed your request."
        }]
      });
    }

    return res.status(200).json({
      response: procData.message || "I've processed your request.",
      endCall: false
    });

  } catch (error) {
    console.error('Vapi Webhook Error:', error);
    
    // Always return a valid result for tool-calls to prevent Vapi from hanging
    const payload = req.body;
    if (payload?.message?.type === 'tool-calls' && payload.message.toolCalls?.length > 0) {
      return res.status(200).json({
        results: [{ toolCallId: payload.message.toolCalls[0].id, result: "I encountered an error." }]
      });
    }
    
    res.status(200).json({ 
      response: "I'm sorry, I encountered an error. Please try again.",
      endCall: false 
    });
  }
});

export default router;
