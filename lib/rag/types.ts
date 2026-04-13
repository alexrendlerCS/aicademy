/**
 * Shared TypeScript types for RAG (Retrieval-Augmented Generation) system
 */

export interface LessonChunk {
  chunkIndex: number;
  sectionTitle?: string;
  chunkText: string;
  metadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  headingLevel?: number;
  wordCount?: number;
  hasCode?: boolean;
  hasList?: boolean;
  hasBlockquote?: boolean;
  tags?: string[];
}

export interface ChunkingOptions {
  minChunkSize?: number;    // Default: 100 words
  maxChunkSize?: number;    // Default: 300 words
  preserveHeadings?: boolean; // Default: true
  includeMetadata?: boolean;  // Default: true
}

export interface RetrievedChunk {
  id: string;
  lessonId: string;
  moduleId: string;
  chunkIndex: number;
  sectionTitle?: string;
  chunkText: string;
  metadata: any;
  similarity: number;
}

export interface SearchParams {
  query: string;
  moduleId?: string;      // Optional: filter by module
  lessonId?: string;      // Optional: filter by lesson
  matchCount?: number;    // Default: 5
  matchThreshold?: number; // Default: 0.5 (50% similarity)
}

export interface EmbeddingResult {
  text: string;           // Original text that was embedded
  embedding: number[];    // Vector embedding
  index: number;          // Index in batch (for tracking)
  error?: string;         // Error message if embedding failed
}
