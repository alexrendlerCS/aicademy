/**
 * Embedding Generation using Ollama
 * 
 * Uses local Ollama instance to generate embeddings for text chunks.
 * Model: nomic-embed-text (produces 768-dimensional embeddings)
 * 
 * Note: Requires Ollama to be running locally with nomic-embed-text model installed.
 * Install with: ollama pull nomic-embed-text
 */

import { EmbeddingResult } from './types';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text'; // 768 dimensions

/**
 * Generate embedding for a single text string
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple text strings in batch
 * Processes sequentially to avoid overwhelming Ollama
 */
export async function getBatchEmbeddings(
  texts: string[],
  options?: {
    onProgress?: (current: number, total: number) => void;
    delayMs?: number; // Delay between requests to avoid rate limiting
  }
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  const delayMs = options?.delayMs || 100; // Default 100ms delay

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    
    try {
      const embedding = await getEmbedding(text);
      
      results.push({
        text,
        embedding,
        index: i,
      });

      // Report progress
      if (options?.onProgress) {
        options.onProgress(i + 1, texts.length);
      }

      // Add delay between requests (except for last one)
      if (i < texts.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Error generating embedding for text ${i}:`, error);
      // Continue with other texts even if one fails
      results.push({
        text,
        embedding: [],
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Check if Ollama is running and has the embedding model
 */
export async function checkOllamaEmbeddingModel(): Promise<{
  isRunning: boolean;
  hasModel: boolean;
  modelInfo?: any;
  error?: string;
}> {
  try {
    // Check if Ollama is running
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    
    if (!response.ok) {
      return {
        isRunning: false,
        hasModel: false,
        error: `Ollama not responding: ${response.status}`,
      };
    }

    const data = await response.json();
    const models = data.models || [];
    
    // Check if embedding model is installed
    const embeddingModel = models.find((m: any) => 
      m.name.includes(EMBEDDING_MODEL)
    );

    if (!embeddingModel) {
      return {
        isRunning: true,
        hasModel: false,
        error: `Model '${EMBEDDING_MODEL}' not found. Install with: ollama pull ${EMBEDDING_MODEL}`,
      };
    }

    return {
      isRunning: true,
      hasModel: true,
      modelInfo: embeddingModel,
    };
  } catch (error) {
    return {
      isRunning: false,
      hasModel: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get embedding model dimensions
 * nomic-embed-text produces 768-dimensional vectors
 */
export function getEmbeddingDimensions(): number {
  return 768;
}

/**
 * Calculate cosine similarity between two embeddings
 * Useful for testing and debugging
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
