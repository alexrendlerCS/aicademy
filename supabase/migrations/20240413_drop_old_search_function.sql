-- Drop the old search_lesson_chunks function that accepts vector(768)
-- This resolves the function overloading conflict

DROP FUNCTION IF EXISTS search_lesson_chunks(vector(768), uuid, uuid, float, int);

-- The new TEXT-based version created in 20240413_fix_rpc_text_input.sql will remain
