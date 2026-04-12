# AICademy RAG Implementation Plan - Phase 1
## Retrieval-Augmented Generation for Educational AI Tutor

**Status:** Ready to Implement  
**Target Completion:** Weekend Project  
**Last Updated:** April 12, 2026

---

## 🎯 Executive Summary

Transform the current AI tutor from **static full-content injection** to **retrieval-based context assembly** using vector embeddings and semantic search.

**Current Problem:**
- Entire lesson HTML dumped into every prompt
- No relevance filtering
- Cannot access related content across lessons
- Inefficient token usage

**Phase 1 Solution:**
- Chunk lessons into semantic segments
- Generate embeddings for each chunk
- Retrieve only relevant chunks per question
- Build context from retrieved snippets

---

## 📋 Implementation Checklist

### Step 1: Database Foundation ✅
- [ ] Enable pgvector extension in Supabase
- [ ] Create `lesson_chunks` table with schema
- [ ] Add vector similarity search index
- [ ] Create retrieval RPC function
- [ ] Test vector operations

### Step 2: Chunking Utility 🔧
- [ ] Create `/lib/rag/chunk-lessons.ts`
- [ ] Implement HTML/Markdown parser
- [ ] Build semantic chunking logic
- [ ] Add section title extraction
- [ ] Test on sample lessons

### Step 3: Embedding Pipeline 🤖
- [ ] Create `/lib/rag/embeddings.ts` wrapper
- [ ] Choose embedding provider (OpenAI/local)
- [ ] Build `/scripts/generate-lesson-embeddings.ts`
- [ ] Add progress logging
- [ ] Implement safe upsert logic

### Step 4: Retrieval System 🔍
- [ ] Create `/lib/rag/search-lesson-chunks.ts`
- [ ] Implement similarity search
- [ ] Add filtering by module/lesson
- [ ] Set match threshold logic
- [ ] Return ranked results with metadata

### Step 5: Prompt Refactor 📝
- [ ] Update `generateSystemPrompt()` signature
- [ ] Replace static content with retrieval
- [ ] Format retrieved chunks for prompt
- [ ] Add fallback logic
- [ ] Preserve pedagogical style

### Step 6: API Route Update 🔌
- [ ] Extract latest user message
- [ ] Pass query to `generateSystemPrompt()`
- [ ] Add retrieval logging
- [ ] Test with real conversations

### Step 7: Testing & Validation ✅
- [ ] Test retrieval quality
- [ ] Verify tutor responses
- [ ] Check fallback behavior
- [ ] Measure performance
- [ ] Document findings

---

## 🗄️ Database Schema

### New Table: `lesson_chunks`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create lesson_chunks table
CREATE TABLE lesson_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  section_title TEXT,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique chunks per lesson
  UNIQUE(lesson_id, chunk_index)
);

-- Create indexes
CREATE INDEX idx_lesson_chunks_lesson_id ON lesson_chunks(lesson_id);
CREATE INDEX idx_lesson_chunks_module_id ON lesson_chunks(module_id);
CREATE INDEX idx_lesson_chunks_embedding ON lesson_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Add RLS policies
ALTER TABLE lesson_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON lesson_chunks FOR SELECT
  TO authenticated
  USING (true);

-- Migration file path
-- /supabase/migrations/YYYYMMDD_create_lesson_chunks.sql
```

### Vector Search RPC Function

```sql
-- Create similarity search function
CREATE OR REPLACE FUNCTION search_lesson_chunks(
  query_embedding vector(1536),
  match_module_id uuid DEFAULT NULL,
  match_lesson_id uuid DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  lesson_id uuid,
  module_id uuid,
  chunk_index int,
  section_title text,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id,
    lc.lesson_id,
    lc.module_id,
    lc.chunk_index,
    lc.section_title,
    lc.chunk_text,
    lc.metadata,
    1 - (lc.embedding <=> query_embedding) as similarity
  FROM lesson_chunks lc
  WHERE 
    (match_module_id IS NULL OR lc.module_id = match_module_id)
    AND (match_lesson_id IS NULL OR lc.lesson_id = match_lesson_id)
    AND 1 - (lc.embedding <=> query_embedding) > match_threshold
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 📦 File Structure

```
/lib/rag/
├── chunk-lessons.ts           # Lesson chunking logic
├── embeddings.ts              # Embedding provider wrapper
├── search-lesson-chunks.ts    # Vector retrieval helper
└── types.ts                   # Shared RAG types

/scripts/
├── generate-lesson-embeddings.ts   # Batch embedding script
└── test-retrieval.ts               # Retrieval quality tests

/supabase/migrations/
└── YYYYMMDD_create_lesson_chunks.sql

/lib/
└── ai-utils.ts                # Updated with RAG
```

---

## 🔧 Implementation Details

### 1. Chunking Utility

**File:** `/lib/rag/chunk-lessons.ts`

```typescript
import { JSDOM } from 'jsdom';

export interface LessonChunk {
  chunkIndex: number;
  sectionTitle?: string;
  chunkText: string;
  metadata?: {
    headingLevel?: number;
    wordCount?: number;
    hasCode?: boolean;
    hasList?: boolean;
  };
}

export interface ChunkingOptions {
  minChunkSize?: number;    // Default: 100 words
  maxChunkSize?: number;    // Default: 300 words
  preserveHeadings?: boolean; // Default: true
}

/**
 * Chunks lesson HTML/Markdown content into semantic segments
 */
export function chunkLessonContent(
  htmlContent: string,
  options: ChunkingOptions = {}
): LessonChunk[] {
  const {
    minChunkSize = 100,
    maxChunkSize = 300,
    preserveHeadings = true,
  } = options;

  const chunks: LessonChunk[] = [];
  
  // Parse HTML
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  let currentChunk: {
    text: string[];
    sectionTitle?: string;
    metadata: any;
  } = {
    text: [],
    metadata: {},
  };
  
  let chunkIndex = 0;
  
  // Traverse DOM and build chunks
  const elements = document.body.querySelectorAll('h1, h2, h3, h4, p, ul, ol, pre, blockquote');
  
  elements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    
    // Skip empty elements
    if (!text) return;
    
    // Check if this is a heading
    if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
      // Finish current chunk if it has content
      if (currentChunk.text.length > 0) {
        chunks.push(finalizeChunk(currentChunk, chunkIndex++));
        currentChunk = { text: [], metadata: {} };
      }
      
      // Start new section
      currentChunk.sectionTitle = text;
      currentChunk.metadata.headingLevel = parseInt(tagName[1]);
      return;
    }
    
    // Add text to current chunk
    currentChunk.text.push(text);
    
    // Track metadata
    if (tagName === 'pre') {
      currentChunk.metadata.hasCode = true;
    }
    if (['ul', 'ol'].includes(tagName)) {
      currentChunk.metadata.hasList = true;
    }
    
    // Check if chunk is getting too large
    const wordCount = currentChunk.text.join(' ').split(/\s+/).length;
    
    if (wordCount >= maxChunkSize) {
      chunks.push(finalizeChunk(currentChunk, chunkIndex++));
      currentChunk = {
        text: [],
        sectionTitle: currentChunk.sectionTitle, // Preserve section context
        metadata: {},
      };
    }
  });
  
  // Add final chunk
  if (currentChunk.text.length > 0) {
    chunks.push(finalizeChunk(currentChunk, chunkIndex++));
  }
  
  // Filter out chunks that are too small
  return chunks.filter((chunk) => {
    const wordCount = chunk.chunkText.split(/\s+/).length;
    return wordCount >= minChunkSize;
  });
}

function finalizeChunk(
  chunk: { text: string[]; sectionTitle?: string; metadata: any },
  index: number
): LessonChunk {
  const chunkText = chunk.text.join('\n\n');
  const wordCount = chunkText.split(/\s+/).length;
  
  return {
    chunkIndex: index,
    sectionTitle: chunk.sectionTitle,
    chunkText,
    metadata: {
      ...chunk.metadata,
      wordCount,
    },
  };
}

/**
 * Clean and normalize text for embedding
 */
export function normalizeTextForEmbedding(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[^\w\s.,!?-]/g, '')   // Remove special chars
    .trim();
}
```

---

### 2. Embedding Provider Wrapper

**File:** `/lib/rag/embeddings.ts`

```typescript
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokensUsed: number;
}

/**
 * Generate embedding for text using OpenAI
 * Abstracted so we can swap providers later
 */
export async function getEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    });
    
    return {
      embedding: response.data[0].embedding,
      model: response.model,
      tokensUsed: response.usage.total_tokens,
    };
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Batch generate embeddings (more efficient for large datasets)
 */
export async function getBatchEmbeddings(
  texts: string[],
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult[]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: texts,
      encoding_format: 'float',
    });
    
    return response.data.map((item, index) => ({
      embedding: item.embedding,
      model: response.model,
      tokensUsed: response.usage.total_tokens / texts.length, // Approximate
    }));
  } catch (error) {
    console.error('Batch embedding generation failed:', error);
    throw new Error(`Failed to generate batch embeddings: ${error}`);
  }
}
```

---

### 3. Vector Search Helper

**File:** `/lib/rag/search-lesson-chunks.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';
import { getEmbedding } from './embeddings';

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
  moduleId: string;
  lessonId?: string;
  matchCount?: number;
  matchThreshold?: number;
}

/**
 * Search for relevant lesson chunks using vector similarity
 */
export async function searchLessonChunks(
  params: SearchParams
): Promise<RetrievedChunk[]> {
  const {
    query,
    moduleId,
    lessonId,
    matchCount = 5,
    matchThreshold = 0.7,
  } = params;
  
  console.log('🔍 Searching lesson chunks:', {
    queryLength: query.length,
    moduleId,
    lessonId,
    matchCount,
    matchThreshold,
  });
  
  try {
    // Generate embedding for the query
    const { embedding: queryEmbedding } = await getEmbedding(query);
    
    // Call Supabase RPC function for similarity search
    const { data, error } = await supabase.rpc('search_lesson_chunks', {
      query_embedding: queryEmbedding,
      match_module_id: moduleId,
      match_lesson_id: lessonId || null,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });
    
    if (error) {
      console.error('❌ Vector search error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No chunks found matching criteria');
      return [];
    }
    
    // Map results to our interface
    const chunks: RetrievedChunk[] = data.map((row: any) => ({
      id: row.id,
      lessonId: row.lesson_id,
      moduleId: row.module_id,
      chunkIndex: row.chunk_index,
      sectionTitle: row.section_title,
      chunkText: row.chunk_text,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
    
    console.log('✅ Retrieved chunks:', {
      count: chunks.length,
      topSimilarity: chunks[0]?.similarity.toFixed(3),
      avgSimilarity: (
        chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length
      ).toFixed(3),
    });
    
    return chunks;
  } catch (error) {
    console.error('❌ searchLessonChunks failed:', error);
    return [];
  }
}
```

---

### 4. Embedding Generation Script

**File:** `/scripts/generate-lesson-embeddings.ts`

```typescript
import { supabase } from '../lib/supabaseClient';
import { chunkLessonContent, normalizeTextForEmbedding } from '../lib/rag/chunk-lessons';
import { getBatchEmbeddings } from '../lib/rag/embeddings';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
}

async function generateEmbeddingsForAllLessons() {
  console.log('🚀 Starting lesson embedding generation...\n');
  
  try {
    // Fetch all lessons
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, module_id, title, content')
      .order('module_id, order_index');
    
    if (fetchError) throw fetchError;
    
    if (!lessons || lessons.length === 0) {
      console.log('⚠️ No lessons found');
      return;
    }
    
    console.log(`📚 Found ${lessons.length} lessons\n`);
    
    let totalChunks = 0;
    let processedLessons = 0;
    
    for (const lesson of lessons) {
      console.log(`\n📖 Processing: "${lesson.title}" (${lesson.id})`);
      
      // Skip empty lessons
      if (!lesson.content || lesson.content.trim().length === 0) {
        console.log('  ⏭️  Skipping empty lesson');
        continue;
      }
      
      try {
        // Delete existing chunks for this lesson (for re-processing)
        await supabase
          .from('lesson_chunks')
          .delete()
          .eq('lesson_id', lesson.id);
        
        // Chunk the lesson
        const chunks = chunkLessonContent(lesson.content);
        console.log(`  ✂️  Created ${chunks.length} chunks`);
        
        if (chunks.length === 0) {
          console.log('  ⚠️  No valid chunks created');
          continue;
        }
        
        // Prepare texts for embedding
        const textsToEmbed = chunks.map((chunk) => {
          const prefix = chunk.sectionTitle ? `${chunk.sectionTitle}\n\n` : '';
          return normalizeTextForEmbedding(prefix + chunk.chunkText);
        });
        
        // Generate embeddings in batch
        console.log('  🤖 Generating embeddings...');
        const embeddings = await getBatchEmbeddings(textsToEmbed);
        
        // Prepare chunk records for insertion
        const chunkRecords = chunks.map((chunk, index) => ({
          lesson_id: lesson.id,
          module_id: lesson.module_id,
          chunk_index: chunk.chunkIndex,
          section_title: chunk.sectionTitle,
          chunk_text: chunk.chunkText,
          metadata: chunk.metadata,
          embedding: embeddings[index].embedding,
        }));
        
        // Insert chunks
        const { error: insertError } = await supabase
          .from('lesson_chunks')
          .insert(chunkRecords);
        
        if (insertError) {
          console.error('  ❌ Insert error:', insertError);
          continue;
        }
        
        console.log(`  ✅ Inserted ${chunks.length} chunks`);
        totalChunks += chunks.length;
        processedLessons++;
        
        // Rate limiting: small delay between lessons
        await new Promise((resolve) => setTimeout(resolve, 100));
        
      } catch (lessonError) {
        console.error(`  ❌ Failed to process lesson:`, lessonError);
      }
    }
    
    console.log(`\n\n🎉 Embedding generation complete!`);
    console.log(`   Processed: ${processedLessons}/${lessons.length} lessons`);
    console.log(`   Total chunks: ${totalChunks}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateEmbeddingsForAllLessons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
```

**Running the script:**
```bash
# Add to package.json scripts:
"generate-embeddings": "tsx scripts/generate-lesson-embeddings.ts"

# Run:
pnpm generate-embeddings
```

---

### 5. Updated `generateSystemPrompt()`

**File:** `/lib/ai-utils.ts` (Updated)

```typescript
import { supabase } from "./supabaseClient";
import { searchLessonChunks, RetrievedChunk } from "./rag/search-lesson-chunks";

interface StudentContext {
  userId: string;
  moduleId: string;
  lessonId?: string;
}

/**
 * Generate context-aware system prompt with RAG-based content retrieval
 */
export async function generateSystemPrompt(
  context: StudentContext,
  userQuery: string = ""
): Promise<string> {
  console.log("🔧 Generating system prompt with RAG");
  
  // STEP 1: Fetch Student Profile
  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("id", context.userId)
    .single();

  // STEP 2: Fetch Module Data
  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("id", context.moduleId)
    .single();

  // STEP 3: Fetch Lesson Metadata (title, not full content)
  let lessonData = null;
  if (context.lessonId) {
    const { data } = await supabase
      .from("lessons")
      .select("id, title, module_id, order_index")
      .eq("id", context.lessonId)
      .single();
    lessonData = data;
  }

  // STEP 4: Fetch Student Progress
  const { data: progressData } = await supabase
    .from("student_modules")
    .select("*")
    .eq("student_id", context.userId)
    .eq("module_id", context.moduleId)
    .single();

  // STEP 5: Fetch Recent Quiz Performance
  const { data: quizScores } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("student_id", context.userId)
    .order("attempted_at", { ascending: false })
    .limit(5);

  // Calculate metrics
  const quizPerformance = quizScores?.length
    ? `${quizScores.filter((q) => q.is_correct).length}/${quizScores.length} correct`
    : "No recent attempts";

  const progressPercentage = progressData?.progress
    ? Math.round(progressData.progress * 100)
    : 0;

  // STEP 6: RAG RETRIEVAL - Get relevant lesson chunks
  let retrievedChunks: RetrievedChunk[] = [];
  let lessonContext = "";
  
  if (userQuery && userQuery.trim().length > 0) {
    console.log("🔍 Retrieving relevant lesson chunks for query:", userQuery.substring(0, 100));
    
    retrievedChunks = await searchLessonChunks({
      query: userQuery,
      moduleId: context.moduleId,
      lessonId: context.lessonId,
      matchCount: 5,
      matchThreshold: 0.65,
    });
    
    if (retrievedChunks.length > 0) {
      // Format retrieved chunks for prompt
      lessonContext = formatRetrievedChunks(retrievedChunks);
      console.log(`✅ Retrieved ${retrievedChunks.length} relevant chunks`);
    } else {
      console.warn("⚠️ No relevant chunks found, using fallback");
      lessonContext = await getFallbackLessonContext(context.lessonId);
    }
  } else {
    // No query provided, use fallback
    lessonContext = await getFallbackLessonContext(context.lessonId);
  }

  // STEP 7: Construct System Prompt
  const systemPrompt = `You are an AI learning coach built into an online course platform. Your goal is to provide clear, direct answers and engage students in a natural conversation about the concepts they're learning.

**Student Profile:**
- Name: ${studentData?.name || "Student"}
- Level: ${studentData?.level || "1"}
- Current progress: ${progressPercentage}% complete
- Recent quiz performance: ${quizPerformance}

**Current Learning Context:**
- Module: ${moduleData?.title || "Current Module"}
- Lesson: ${lessonData?.title || "Current Lesson"}

**Relevant Lesson Content:**
${lessonContext}

**CRITICAL INSTRUCTIONS:**
1. Ground your answers in the lesson content provided above
2. If the lesson excerpts don't strongly support an answer, acknowledge this and guide the student using closest relevant concepts
3. Quote or paraphrase lesson material when helpful
4. Keep explanations brief (2-3 sentences max)
5. Use a tutoring approach that encourages thinking, not just answer-giving

**RESPONSE FORMAT (strictly follow):**

### [Topic Name]

[Brief, clear explanation of the concept in 2-3 sentences]

From the lesson:
> [Short, relevant quote that supports the explanation]

Would you like me to:
• Show you a practical example of [specific concept]?
• Help you understand [related concept] better?
• Demonstrate how this works in a real project?`;

  return systemPrompt;
}

/**
 * Format retrieved chunks into readable context for the prompt
 */
function formatRetrievedChunks(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const header = chunk.sectionTitle 
        ? `[Section: ${chunk.sectionTitle}]` 
        : `[Excerpt ${index + 1}]`;
      
      const similarity = `(relevance: ${(chunk.similarity * 100).toFixed(0)}%)`;
      
      return `${header} ${similarity}\n${chunk.chunkText}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Fallback: provide minimal lesson context when retrieval fails
 */
async function getFallbackLessonContext(lessonId?: string): Promise<string> {
  if (!lessonId) {
    return "No specific lesson context available. Use general knowledge to guide the student.";
  }
  
  // Fetch just the lesson title and a summary if available
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, content")
    .eq("id", lessonId)
    .single();
  
  if (!lesson) {
    return "Lesson content temporarily unavailable.";
  }
  
  // Return truncated content as fallback
  const truncated = lesson.content
    ? lesson.content.substring(0, 500) + "..."
    : "No content available";
  
  return `[Fallback - Limited Context]\nLesson: ${lesson.title}\n\n${truncated}`;
}
```

---

### 6. Updated API Route

**File:** `/app/api/ai-chat/route.ts` (Updated)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateSystemPrompt } from "@/lib/ai-utils";

// ... keep existing ensureMarkdownFormatting function ...

export async function POST(req: NextRequest) {
  console.log("📨 Received chat request");

  try {
    const body = await req.json();
    const { messages, userId, moduleId, lessonId } = body;

    // Validate required fields
    if (!userId || !moduleId) {
      console.error("❌ Missing required fields:", { userId, moduleId });
      return NextResponse.json(
        {
          error: "Missing required fields: userId and moduleId are required",
        },
        { status: 400 }
      );
    }

    // Extract latest user message for retrieval
    const latestUserMessage = messages && messages.length > 0
      ? messages[messages.length - 1].content
      : "";

    console.log("📝 Request context:", {
      userId,
      moduleId,
      lessonId,
      messageCount: messages?.length || 0,
      queryPreview: latestUserMessage.substring(0, 100),
    });

    // Generate system prompt with RAG retrieval
    const systemPrompt = await generateSystemPrompt(
      {
        userId,
        moduleId,
        lessonId,
      },
      latestUserMessage  // ⭐ NEW: Pass query for retrieval
    );

    // Add system prompt as first message
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log("🤖 Sending request to Ollama");

    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2",
        messages: messagesWithSystem,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error("❌ Ollama server error:", {
        status: ollamaRes.status,
        statusText: ollamaRes.statusText,
        error: errorText,
      });
      throw new Error(
        `Ollama server error: ${ollamaRes.status} ${ollamaRes.statusText}`
      );
    }

    const data = await ollamaRes.json();
    console.log("✅ Received AI response:", {
      messageRole: data.message?.role,
      messageLength: data.message?.content?.length,
    });

    // Ensure proper markdown formatting
    const formattedContent = ensureMarkdownFormatting(
      data.message?.content || ""
    );

    const aiMessage = {
      role: "assistant",
      content: formattedContent,
    };

    return NextResponse.json({ aiMessage });
  } catch (err) {
    console.error("❌ AI Chat Error:", err);

    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    const isConnectionError =
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        aiMessage: {
          role: "assistant",
          content: isConnectionError
            ? "### Error\nUnable to connect to AI service. Please check if the Ollama server is running."
            : "### Error\nError contacting AI service. Please try again.",
        },
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
// Test chunking
describe('chunkLessonContent', () => {
  it('should split lesson into semantic chunks', () => {
    const html = `
      <h2>Functions</h2>
      <p>Functions are reusable blocks of code...</p>
      <h3>Parameters</h3>
      <p>Parameters allow you to pass data...</p>
    `;
    const chunks = chunkLessonContent(html);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].sectionTitle).toBe('Functions');
  });
});

// Test retrieval
describe('searchLessonChunks', () => {
  it('should return relevant chunks for query', async () => {
    const results = await searchLessonChunks({
      query: 'What are functions?',
      moduleId: 'test-module-id',
      matchCount: 3,
    });
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0].similarity).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests

1. **Test full retrieval flow:**
   - Send chat message
   - Verify chunks retrieved
   - Check prompt construction
   - Validate response quality

2. **Test fallback behavior:**
   - Query with no matches
   - Empty lesson
   - Missing lessonId

3. **Performance tests:**
   - Measure retrieval latency
   - Check embedding generation speed
   - Monitor token usage reduction

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Retrieval latency | < 500ms | Time from query to chunks |
| Chunk relevance | > 70% similarity | Average similarity score |
| Token reduction | > 50% | Prompt size before/after |
| Response quality | > 4/5 rating | Manual evaluation |
| Fallback rate | < 10% | % using fallback logic |

---

## 🚀 Deployment Checklist

- [ ] Run database migration in production
- [ ] Generate embeddings for all lessons
- [ ] Test retrieval on production data
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Measure performance metrics
- [ ] Document findings for Phase 2

---

## 🔮 Phase 2 Preview

**Not in scope for Phase 1, but designed for:**

1. **Conversation Memory**
   - Store chat history with embeddings
   - Retrieve past confusions
   - Reference prior explanations

2. **Cross-Module Retrieval**
   - Search beyond current module
   - Link related concepts
   - Build prerequisite chains

3. **Adaptive Tutoring**
   - Use quiz performance for retrieval weighting
   - Adjust difficulty based on progress
   - Personalize chunk selection

4. **Hybrid Search**
   - Combine keyword + semantic search
   - Add BM25 scoring
   - Implement reranking

5. **Evaluation Dashboard**
   - Track retrieval quality
   - Monitor response helpfulness
   - Analyze student outcomes

---

## 📝 Notes for Implementation

1. **Start with database migration** - Foundation first
2. **Test chunking on sample lessons** - Validate before batch
3. **Use small batch for initial embeddings** - Test pipeline
4. **Add extensive logging** - Debug retrieval issues
5. **Keep frontend unchanged** - Backend-only refactor
6. **Maintain backward compatibility** - Fallback ensures stability

---

## 🛠️ Required Dependencies

```json
{
  "dependencies": {
    "openai": "^4.x.x",
    "jsdom": "^24.x.x"
  },
  "devDependencies": {
    "@types/jsdom": "^21.x.x",
    "tsx": "^4.x.x"
  }
}
```

---

## 🎯 Final Deliverable

A working RAG system where:
- ✅ Lessons are chunked semantically
- ✅ Embeddings are generated and stored
- ✅ Student questions trigger retrieval
- ✅ Only relevant chunks enter prompts
- ✅ Tutor maintains pedagogical quality
- ✅ System is extensible for Phase 2

**Timeline:** 2-3 days for full implementation  
**Risk Level:** Low (fallback logic ensures stability)  
**Impact:** High (foundation for all future AI improvements)

---

**Ready to implement? Start with Step 1: Database Foundation** 🚀
