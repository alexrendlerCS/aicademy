/**
 * Lesson Content Chunking Utility
 * Splits HTML/Markdown lesson content into semantic chunks for RAG
 */

import { JSDOM } from 'jsdom';
import { LessonChunk, ChunkingOptions, ChunkMetadata } from './types';

/**
 * Chunks lesson HTML/Markdown content into semantic segments
 * 
 * @param htmlContent - The lesson content (HTML or Markdown)
 * @param options - Chunking configuration options
 * @returns Array of lesson chunks with metadata
 */
export function chunkLessonContent(
  htmlContent: string,
  options: ChunkingOptions = {}
): LessonChunk[] {
  const {
    minChunkSize = 50,      // Reduced from 100 to handle smaller lessons
    maxChunkSize = 300,
    preserveHeadings = true,
    includeMetadata = true,
  } = options;

  // Handle empty content
  if (!htmlContent || htmlContent.trim().length === 0) {
    return [];
  }

  const chunks: LessonChunk[] = [];
  
  try {
    // Parse HTML - wrap in body if not already
    const wrappedContent = htmlContent.includes('<body>') 
      ? htmlContent 
      : `<body>${htmlContent}</body>`;
    
    const dom = new JSDOM(wrappedContent);
    const document = dom.window.document;
    
    let currentChunk: {
      text: string[];
      sectionTitle?: string;
      metadata: ChunkMetadata;
    } = {
      text: [],
      metadata: {},
    };
    
    let chunkIndex = 0;
    
    // Select all block-level content elements
    const body = document.querySelector('body');
    if (!body) {
      throw new Error('No body element found');
    }
    
    const elements = body.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote, div.bg-muted'
    );
    
    elements.forEach((el: Element) => {
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';
      
      // Skip empty elements
      if (!text) return;
      
      // Check if this is a heading
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        // Finish current chunk if it has content
        if (currentChunk.text.length > 0) {
          chunks.push(finalizeChunk(currentChunk, chunkIndex++, includeMetadata));
          currentChunk = { text: [], metadata: {} };
        }
        
        // Start new section with heading as title
        if (preserveHeadings) {
          currentChunk.sectionTitle = text;
          currentChunk.metadata.headingLevel = parseInt(tagName[1]);
        }
        return;
      }
      
      // Add text to current chunk
      currentChunk.text.push(text);
      
      // Track metadata
      if (includeMetadata) {
        if (tagName === 'pre') {
          currentChunk.metadata.hasCode = true;
        }
        if (['ul', 'ol'].includes(tagName)) {
          currentChunk.metadata.hasList = true;
        }
        if (tagName === 'blockquote') {
          currentChunk.metadata.hasBlockquote = true;
        }
      }
      
      // Check if chunk is getting too large
      const wordCount = currentChunk.text.join(' ').split(/\s+/).length;
      
      if (wordCount >= maxChunkSize) {
        chunks.push(finalizeChunk(currentChunk, chunkIndex++, includeMetadata));
        currentChunk = {
          text: [],
          sectionTitle: currentChunk.sectionTitle, // Preserve section context
          metadata: {},
        };
      }
    });
    
    // Add final chunk if it has enough content
    if (currentChunk.text.length > 0) {
      chunks.push(finalizeChunk(currentChunk, chunkIndex++, includeMetadata));
    }
    
    // Filter out chunks that are too small
    return chunks.filter((chunk) => {
      const wordCount = chunk.chunkText.split(/\s+/).length;
      return wordCount >= minChunkSize;
    });
    
  } catch (error) {
    console.error('Error chunking lesson content:', error);
    // Fallback: return entire content as one chunk
    return [{
      chunkIndex: 0,
      chunkText: stripHtmlTags(htmlContent),
      metadata: { wordCount: htmlContent.split(/\s+/).length },
    }];
  }
  
  return chunks;
}

/**
 * Finalize a chunk by combining text and calculating final metadata
 */
function finalizeChunk(
  chunk: { text: string[]; sectionTitle?: string; metadata: ChunkMetadata },
  index: number,
  includeMetadata: boolean
): LessonChunk {
  const chunkText = chunk.text.join('\n\n');
  const wordCount = chunkText.split(/\s+/).length;
  
  return {
    chunkIndex: index,
    sectionTitle: chunk.sectionTitle,
    chunkText: chunkText.trim(),
    metadata: includeMetadata ? {
      ...chunk.metadata,
      wordCount,
    } : undefined,
  };
}

/**
 * Clean and normalize text for embedding generation
 * Removes extra whitespace and special characters
 */
export function normalizeTextForEmbedding(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')        // Remove HTML tags
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[^\w\s.,!?;:()\-'"/]/g, '') // Keep only basic punctuation
    .trim();
}

/**
 * Strip HTML tags from content (simple fallback)
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract keywords from chunk text for metadata
 * Simple implementation - can be enhanced with NLP
 */
export function extractKeywords(text: string, limit: number = 5): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'they', 'their', 'them',
  ]);
  
  // Extract words and count frequency
  const words = text
    .toLowerCase()
    .match(/\b[a-z]{3,}\b/g) || [];
  
  const wordFreq = new Map<string, number>();
  
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Validate chunk quality
 * Returns true if chunk meets quality standards
 */
export function validateChunk(chunk: LessonChunk, minWords: number = 50): boolean {
  if (!chunk.chunkText || chunk.chunkText.trim().length === 0) {
    return false;
  }
  
  const wordCount = chunk.chunkText.split(/\s+/).length;
  return wordCount >= minWords;
}
