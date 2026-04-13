/**
 * Check the actual column type in the database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnType() {
  console.log('🔍 Checking column types...\n');

  const { data, error } = await supabase
    .from('lesson_chunks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const chunk = data[0];
    console.log('Sample chunk data:');
    console.log('- embedding type:', typeof chunk.embedding);
    console.log('- embedding is array:', Array.isArray(chunk.embedding));
    console.log('- embedding is string:', typeof chunk.embedding === 'string');
    
    if (typeof chunk.embedding === 'string') {
      console.log('- embedding string length:', chunk.embedding.length);
      console.log('- embedding preview:', chunk.embedding.substring(0, 100));
      console.log('\n❌ PROBLEM: Embeddings are stored as STRING, not VECTOR');
      console.log('\n📋 You need to run this SQL in Supabase:');
      console.log('');
      console.log('-- Delete all existing data');
      console.log('TRUNCATE TABLE lesson_chunks;');
      console.log('');
      console.log('-- Change column type to vector');
      console.log('ALTER TABLE lesson_chunks ALTER COLUMN embedding TYPE vector(768);');
      console.log('');
      console.log('-- Recreate index');
      console.log('DROP INDEX IF EXISTS idx_lesson_chunks_embedding;');
      console.log('CREATE INDEX idx_lesson_chunks_embedding');
      console.log('ON lesson_chunks USING ivfflat (embedding vector_cosine_ops)');
      console.log('WITH (lists = 100);');
    } else if (Array.isArray(chunk.embedding)) {
      console.log('- embedding array length:', chunk.embedding.length);
      console.log('✅ Embeddings appear to be arrays!');
    }
  }
}

checkColumnType().catch(console.error);
