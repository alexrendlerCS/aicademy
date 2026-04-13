/**
 * Quick test to see what type of data we're inserting
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from '../lib/rag/embeddings';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing embedding insert...\n');

  // Generate a test embedding
  const embedding = await getEmbedding("This is a test");
  
  console.log('Embedding info:');
  console.log('- Type:', typeof embedding);
  console.log('- Is Array:', Array.isArray(embedding));
  console.log('- Length:', embedding.length);
  console.log('- First 5 values:', embedding.slice(0, 5));
  console.log();

  // Try to insert
  console.log('Attempting to insert...');
  const { data, error } = await supabase
    .from('lesson_chunks')
    .insert({
      lesson_id: '015eaf77-a468-4241-be15-7ecad83d3919', // Real lesson ID
      module_id: 'b67d472e-8e79-43d1-ac46-15f9b91e57a8', // Real module ID
      chunk_index: 999,
      chunk_text: 'Test chunk',
      embedding: embedding,
    })
    .select();

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert succeeded!');
    console.log('Data:', data);
    
    // Now fetch it back
    const { data: fetchedData } = await supabase
      .from('lesson_chunks')
      .select('*')
      .eq('chunk_index', 999)
      .single();
    
    if (fetchedData) {
      console.log('\nFetched back:');
      console.log('- embedding type:', typeof fetchedData.embedding);
      console.log('- is array:', Array.isArray(fetchedData.embedding));
      if (typeof fetchedData.embedding === 'string') {
        console.log('- string length:', fetchedData.embedding.length);
      } else if (Array.isArray(fetchedData.embedding)) {
        console.log('- array length:', fetchedData.embedding.length);
      }
    }

    // Clean up
    await supabase.from('lesson_chunks').delete().eq('chunk_index', 999);
  }
}

testInsert().catch(console.error);
