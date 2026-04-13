-- Complete RAG Database Setup for Ollama Embeddings
-- Run this entire script in Supabase SQL Editor

-- Step 1: Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop and recreate the lesson_chunks table with correct types
DROP TABLE IF EXISTS lesson_chunks CASCADE;

CREATE TABLE lesson_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  section_title TEXT,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(768),  -- Ollama nomic-embed-text uses 768 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_lesson_chunks_lesson_id ON lesson_chunks(lesson_id);
CREATE INDEX idx_lesson_chunks_module_id ON lesson_chunks(module_id);
CREATE INDEX idx_lesson_chunks_embedding ON lesson_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Step 4: Enable RLS
ALTER TABLE lesson_chunks ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Allow authenticated users to read lesson_chunks"
  ON lesson_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to lesson_chunks"
  ON lesson_chunks FOR ALL
  TO service_role
  USING (true);

-- Step 6: Create the search function
CREATE OR REPLACE FUNCTION search_lesson_chunks(
  query_embedding vector(768),
  match_module_id UUID DEFAULT NULL,
  match_lesson_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  lesson_id UUID,
  module_id UUID,
  chunk_index INT,
  section_title TEXT,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT
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
    1 - (lc.embedding <=> query_embedding) AS similarity
  FROM lesson_chunks lc
  WHERE
    (match_module_id IS NULL OR lc.module_id = match_module_id)
    AND (match_lesson_id IS NULL OR lc.lesson_id = match_lesson_id)
    AND (1 - (lc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Done! Now run: pnpm tsx scripts/generate-lesson-embeddings.ts
