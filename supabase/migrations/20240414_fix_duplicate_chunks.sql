-- Fix RAG Duplicate Chunks Issue
-- This script removes duplicate chunks and adds a unique constraint

-- Step 1: Check current state
SELECT 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT (lesson_id, chunk_index)) as unique_by_index,
  COUNT(DISTINCT chunk_text) as unique_by_text
FROM lesson_chunks;

-- Step 2: Delete duplicates, keeping only the first occurrence of each unique chunk
-- We'll keep rows with the earliest created_at for each (lesson_id, chunk_index) combination
DELETE FROM lesson_chunks
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lesson_id, chunk_index 
        ORDER BY created_at ASC
      ) as row_num
    FROM lesson_chunks
  ) ranked
  WHERE row_num > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE lesson_chunks
ADD CONSTRAINT unique_lesson_chunk UNIQUE (lesson_id, chunk_index);

-- Step 4: Verify cleanup
SELECT 
  COUNT(*) as total_chunks_after_cleanup,
  COUNT(DISTINCT (lesson_id, chunk_index)) as unique_by_index,
  COUNT(DISTINCT chunk_text) as unique_by_text
FROM lesson_chunks;

-- Expected result: All three counts should be 29
