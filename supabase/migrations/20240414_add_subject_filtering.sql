-- Enhanced search function with subject filtering
-- Uses existing modules.subject field to prevent cross-domain contamination

-- Drop the old function signature first
DROP FUNCTION IF EXISTS search_lesson_chunks(TEXT, UUID, UUID, FLOAT, INT);

-- Create the enhanced version with subject filtering
CREATE OR REPLACE FUNCTION search_lesson_chunks(
  query_embedding TEXT,
  match_module_id UUID DEFAULT NULL,
  match_lesson_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  match_subject TEXT DEFAULT NULL  -- NEW: Optional subject filter
)
RETURNS TABLE (
  id UUID,
  lesson_id UUID,
  module_id UUID,
  chunk_index INT,
  section_title TEXT,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT,
  subject TEXT  -- NEW: Include subject in results
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
    1 - (lc.embedding <=> query_embedding::vector(768)) AS similarity,
    m.subject  -- Join to get subject
  FROM lesson_chunks lc
  INNER JOIN modules m ON lc.module_id = m.id  -- Join to modules for subject
  WHERE
    (match_module_id IS NULL OR lc.module_id = match_module_id)
    AND (match_lesson_id IS NULL OR lc.lesson_id = match_lesson_id)
    AND (match_subject IS NULL OR m.subject = match_subject)  -- NEW: Optional subject filter
    AND (1 - (lc.embedding <=> query_embedding::vector(768))) >= match_threshold
  ORDER BY lc.embedding <=> query_embedding::vector(768)
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_lesson_chunks IS 
'Vector search with optional subject filtering. Uses modules.subject to prevent cross-domain contamination.';

