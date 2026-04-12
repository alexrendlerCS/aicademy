-- Update lesson_chunks table to use 768-dimensional vectors (Ollama nomic-embed-text)
-- Previous: vector(1536) for OpenAI text-embedding-3-small
-- New: vector(768) for Ollama nomic-embed-text

-- Step 1: Alter the embedding column to use correct dimensions
ALTER TABLE lesson_chunks 
ALTER COLUMN embedding TYPE vector(768);

-- Step 2: Drop and recreate the index with correct dimensions
DROP INDEX IF EXISTS idx_lesson_chunks_embedding;

CREATE INDEX idx_lesson_chunks_embedding 
ON lesson_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: You may need to run VACUUM ANALYZE lesson_chunks; after this
-- to update table statistics for the query planner
