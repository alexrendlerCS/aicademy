-- Updated search function that accepts embedding as TEXT and casts it
-- This works around Supabase JS client issues with vector types

CREATE OR REPLACE FUNCTION search_lesson_chunks(
  query_embedding TEXT,  -- Changed from vector(768) to TEXT
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
    1 - (lc.embedding <=> query_embedding::vector(768)) AS similarity  -- Cast TEXT to vector
  FROM lesson_chunks lc
  WHERE
    (match_module_id IS NULL OR lc.module_id = match_module_id)
    AND (match_lesson_id IS NULL OR lc.lesson_id = match_lesson_id)
    AND (1 - (lc.embedding <=> query_embedding::vector(768))) >= match_threshold
  ORDER BY lc.embedding <=> query_embedding::vector(768)
  LIMIT match_count;
END;
$$;
