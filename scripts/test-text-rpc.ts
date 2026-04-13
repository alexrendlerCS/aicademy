import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from '../lib/rag/embeddings.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testTextRPC() {
  console.log('🧪 Testing TEXT-based RPC function\n');
  
  // Generate embedding
  console.log('Step 1: Generating embedding for "loops"...');
  const embedding = await getEmbedding('loops and iteration');
  console.log(`✅ Got embedding: ${embedding.length} dimensions\n`);
  
  // Convert to text string
  const vectorText = `[${embedding.join(',')}]`;
  console.log(`Step 2: Converted to text string (${vectorText.length} chars)\n`);
  
  // Test with very low threshold
  console.log('Step 3: Calling RPC with threshold 0.1...');
  const { data, error } = await supabase.rpc('search_lesson_chunks', {
    query_embedding: vectorText,
    match_module_id: null,
    match_lesson_id: null,
    match_threshold: 0.1,
    match_count: 5
  });
  
  console.log('Error:', error);
  console.log('Results count:', data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\n✅ SUCCESS! Top results:');
    data.forEach((result: any, i: number) => {
      console.log(`${i + 1}. ${result.section_title || 'Untitled'} - Similarity: ${result.similarity.toFixed(3)}`);
    });
  } else {
    console.log('\n❌ No results returned');
    
    // Let's check if there's any data in the table
    console.log('\nStep 4: Checking table contents...');
    const { data: chunks, error: countError } = await supabase
      .from('lesson_chunks')
      .select('id, section_title, embedding')
      .limit(1);
    
    console.log('Table has data:', chunks && chunks.length > 0);
    if (chunks && chunks[0]) {
      console.log('Sample embedding type:', typeof chunks[0].embedding);
      console.log('Sample embedding value:', 
        typeof chunks[0].embedding === 'string' 
          ? `String (${chunks[0].embedding.length} chars)` 
          : chunks[0].embedding
      );
    }
  }
}

testTextRPC().catch(console.error);
