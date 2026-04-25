import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const isCloud = (process.env.QDRANT_URL || '').includes('cloud.qdrant.io');
const QDRANT_URL = (process.env.QDRANT_URL || 'http://localhost:6333').replace(/:6333$/, '');

const qdrantClient = new QdrantClient({ 
  url: QDRANT_URL,
  port: isCloud ? 443 : 6333,
  apiKey: process.env.QDRANT_API_KEY
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use v1 API and ensure correct model name
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' }, { apiVersion: 'v1' });

const COLLECTION_NAME = 'knowledge_base';

export async function initQdrant() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      console.log(`Creating Qdrant collection: ${COLLECTION_NAME}`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768, // Gemini text-embedding-004 dimension
          distance: 'Cosine'
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      console.warn('text-embedding-004 not found, falling back to embedding-001 (v1)');
      const fallbackModel = genAI.getGenerativeModel({ model: 'embedding-001' }, { apiVersion: 'v1' });
      const result = await fallbackModel.embedContent(text);
      return result.embedding.values;
    }
    throw error;
  }
}

export interface KnowledgeDoc {
  id?: string;
  content: string;
  category: 'scheme' | 'farming_knowledge' | 'faq';
  title: string;
}

export async function upsertDocuments(docs: KnowledgeDoc[]) {
  const points = await Promise.all(docs.map(async (doc) => {
    const vector = await generateEmbedding(`${doc.title}\n${doc.content}`);
    return {
      id: doc.id || crypto.randomUUID(),
      vector,
      payload: {
        content: doc.content,
        category: doc.category,
        title: doc.title,
      }
    };
  }));

  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points
  });
}

export async function searchKnowledge(query: string, limit = 3) {
  try {
    const vector = await generateEmbedding(query);
    const results = await qdrantClient.search(COLLECTION_NAME, {
      vector,
      limit,
      with_payload: true,
    });
    return results;
  } catch (error) {
    console.error('Qdrant search error:', error);
    return [];
  }
}
