/**
 * Debug script to check database state
 * Run with: pnpm tsx lib/rag/debug-db.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('🔍 Debugging Database State\n');

  // Check 1: Count chunks in database
  console.log('Check 1: Counting lesson_chunks...');
  const { count, error: countError } = await supabase
    .from('lesson_chunks')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error:', countError.message);
  } else {
    console.log(`✅ Found ${count} chunks in database\n`);
  }

  // Check 2: Sample a chunk
  console.log('Check 2: Fetching sample chunk...');
  const { data: sampleData, error: sampleError } = await supabase
    .from('lesson_chunks')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('❌ Error:', sampleError.message);
  } else if (sampleData && sampleData.length > 0) {
    const chunk = sampleData[0];
    console.log('✅ Sample chunk:');
    console.log(`   ID: ${chunk.id}`);
    console.log(`   Lesson ID: ${chunk.lesson_id}`);
    console.log(`   Section: ${chunk.section_title || 'Untitled'}`);
    console.log(`   Text preview: ${chunk.chunk_text.substring(0, 100)}...`);
    console.log(`   Embedding dimensions: ${chunk.embedding ? chunk.embedding.length : 'NULL'}`);
    console.log();
  } else {
    console.log('⚠️  No chunks found\n');
  }

  // Check 3: Try calling the RPC function directly
  console.log('Check 3: Testing RPC function...');
  
  // Get an embedding first
  const testEmbedding = new Array(768).fill(0);
  testEmbedding[0] = 1;

  const { data: rpcData, error: rpcError } = await supabase.rpc('search_lesson_chunks', {
    query_embedding: testEmbedding,
    match_module_id: null,
    match_lesson_id: null,
    match_threshold: 0.1,
    match_count: 3,
  });

  if (rpcError) {
    console.error('❌ RPC Error:', rpcError.message);
    console.log('\n💡 This usually means:');
    console.log('   1. The RPC function doesn\'t exist');
    console.log('   2. The embedding column type is wrong (needs vector(768))');
    console.log('   3. The migration hasn\'t been run yet\n');
  } else {
    console.log(`✅ RPC function works! Returned ${rpcData?.length || 0} results\n`);
    if (rpcData && rpcData.length > 0) {
      console.log('Sample result:');
      console.log(`   Similarity: ${rpcData[0].similarity}`);
      console.log(`   Section: ${rpcData[0].section_title || 'Untitled'}`);
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('   If you see errors above, run the migration in Supabase SQL Editor:');
  console.log('   File: supabase/migrations/20240413_update_embedding_dimensions.sql');
}

debugDatabase().catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
