/**
 * Vector Search for Lesson Chunks
 * 
 * Performs semantic search on lesson content using embeddings.
 * Uses Supabase's pgvector extension for efficient similarity search.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEmbedding } from './embeddings';
import { RetrievedChunk, SearchParams } from './types';

// Lazy-initialized Supabase clients
let supabaseAnonInstance: SupabaseClient | null = null;
let supabaseServerInstance: SupabaseClient | null = null;

function getSupabase(useServiceRole: boolean = false): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (useServiceRole) {
    if (!supabaseServerInstance) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (!serviceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
      }
      supabaseServerInstance = createClient(supabaseUrl, serviceKey);
    }
    return supabaseServerInstance;
  } else {
    if (!supabaseAnonInstance) {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (!anonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
      supabaseAnonInstance = createClient(supabaseUrl, anonKey);
    }
    return supabaseAnonInstance;
  }
}

/**
 * Search for relevant lesson chunks based on a query
 * 
 * @param params - Search parameters
 * @returns Array of relevant chunks sorted by similarity
 */
export async function searchLessonChunks(
  params: SearchParams & { useServiceRole?: boolean }
): Promise<RetrievedChunk[]> {
  const {
    query,
    moduleId,
    lessonId,
    matchCount = 5,
    matchThreshold = 0.5,
    useServiceRole = false,
  } = params;

  try {
    // Step 1: Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Step 2: Convert array to PostgreSQL vector format string
    // Supabase JS client needs the vector as a string like '[0.1,0.2,0.3,...]'
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Step 3: Call Supabase RPC function for vector search
    const supabase = getSupabase(useServiceRole);
    const { data, error } = await supabase.rpc('search_lesson_chunks', {
      query_embedding: vectorString,
      match_module_id: moduleId || null,
      match_lesson_id: lessonId || null,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }

    // Step 3: Transform results to RetrievedChunk format
    const chunks: RetrievedChunk[] = (data || []).map((row: any) => ({
      id: row.id,
      lessonId: row.lesson_id,
      moduleId: row.module_id,
      chunkIndex: row.chunk_index,
      sectionTitle: row.section_title,
      chunkText: row.chunk_text,
      metadata: row.metadata,
      similarity: row.similarity,
    }));

    return chunks;
  } catch (error) {
    console.error('Error searching lesson chunks:', error);
    return [];
  }
}

/**
 * Search within a specific lesson only
 */
export async function searchWithinLesson(
  query: string,
  lessonId: string,
  options?: {
    matchCount?: number;
    matchThreshold?: number;
  }
): Promise<RetrievedChunk[]> {
  return searchLessonChunks({
    query,
    lessonId,
    matchCount: options?.matchCount,
    matchThreshold: options?.matchThreshold,
  });
}

/**
 * Search within a specific module only
 */
export async function searchWithinModule(
  query: string,
  moduleId: string,
  options?: {
    matchCount?: number;
    matchThreshold?: number;
  }
): Promise<RetrievedChunk[]> {
  return searchLessonChunks({
    query,
    moduleId,
    matchCount: options?.matchCount,
    matchThreshold: options?.matchThreshold,
  });
}

/**
 * Get all chunks for a specific lesson (for fallback)
 */
export async function getAllLessonChunks(
  lessonId: string
): Promise<RetrievedChunk[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('lesson_chunks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('chunk_index');

    if (error) {
      console.error('Error fetching lesson chunks:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      lessonId: row.lesson_id,
      moduleId: row.module_id,
      chunkIndex: row.chunk_index,
      sectionTitle: row.section_title,
      chunkText: row.chunk_text,
      metadata: row.metadata,
      similarity: 1.0, // Not from similarity search
    }));
  } catch (error) {
    console.error('Error fetching lesson chunks:', error);
    return [];
  }
}

/**
 * Format retrieved chunks for inclusion in prompt
 */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant content found.';
  }

  return chunks
    .map((chunk, index) => {
      const title = chunk.sectionTitle ? `**${chunk.sectionTitle}**` : '';
      const similarity = `(${(chunk.similarity * 100).toFixed(1)}% relevant)`;
      
      return `[Section ${index + 1}] ${title} ${similarity}\n${chunk.chunkText}`;
    })
    .join('\n\n---\n\n');
}
