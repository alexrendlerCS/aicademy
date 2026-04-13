/**
 * Direct RPC test with real query embedding
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from '../lib/rag/embeddings';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  console.log('🔍 Testing RPC Function Directly\n');

  // Generate embedding for a query
  console.log('Generating embedding for "loops"...');
  const queryEmbedding = await getEmbedding("loops");
  console.log(`✅ Generated embedding (${queryEmbedding.length} dimensions)\n`);

  // Test 1: Call RPC with very low threshold
  console.log('Test 1: Calling search_lesson_chunks with threshold 0.1...');
  const { data: data1, error: error1 } = await supabase.rpc('search_lesson_chunks', {
    query_embedding: queryEmbedding,
    match_module_id: null,
    match_lesson_id: null,
    match_threshold: 0.1,
    match_count: 10,
  });

  if (error1) {
    console.error('❌ Error:', error1);
  } else {
    console.log(`✅ Returned ${data1?.length || 0} results`);
    if (data1 && data1.length > 0) {
      data1.forEach((r: any, i: number) => {
        console.log(`  ${i+1}. ${r.section_title || 'Untitled'} - Similarity: ${(r.similarity * 100).toFixed(1)}%`);
      });
    }
  }
  console.log();

  // Test 2: Try with threshold 0
  console.log('Test 2: Calling with threshold 0.0 (get everything)...');
  const { data: data2, error: error2 } = await supabase.rpc('search_lesson_chunks', {
    query_embedding: queryEmbedding,
    match_module_id: null,
    match_lesson_id: null,
    match_threshold: 0.0,
    match_count: 5,
  });

  if (error2) {
    console.error('❌ Error:', error2);
  } else {
    console.log(`✅ Returned ${data2?.length || 0} results`);
    if (data2 && data2.length > 0) {
      data2.forEach((r: any, i: number) => {
        console.log(`  ${i+1}. ${r.section_title || 'Untitled'} - Similarity: ${(r.similarity * 100).toFixed(1)}%`);
      });
    }
  }
  console.log();

  // Test 3: Count all chunks
  console.log('Test 3: Counting all chunks...');
  const { count } = await supabase
    .from('lesson_chunks')
    .select('*', { count: 'exact', head: true });
  console.log(`✅ Total chunks in DB: ${count}`);
}

testRPC().catch(console.error);
