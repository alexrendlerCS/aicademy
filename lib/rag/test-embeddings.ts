/**
 * Test script for Ollama embedding generation
 * Run with: pnpm tsx lib/rag/test-embeddings.ts
 */

import { 
  checkOllamaEmbeddingModel, 
  getEmbedding, 
  getBatchEmbeddings,
  getEmbeddingDimensions,
  cosineSimilarity 
} from './embeddings';

async function testEmbeddings() {
  console.log('🧪 Testing Ollama Embeddings\n');

  // Test 1: Check if Ollama is running and has the model
  console.log('Test 1: Checking Ollama setup...');
  const status = await checkOllamaEmbeddingModel();
  
  if (!status.isRunning) {
    console.error('❌ Ollama is not running!');
    console.error('   Start Ollama with: ollama serve');
    process.exit(1);
  }

  if (!status.hasModel) {
    console.error('❌ Embedding model not found!');
    console.error(`   Install with: ollama pull nomic-embed-text`);
    process.exit(1);
  }

  console.log('✅ Ollama is running');
  console.log('✅ Model installed:', status.modelInfo?.name);
  console.log('   Expected dimensions:', getEmbeddingDimensions());
  console.log();

  // Test 2: Generate single embedding
  console.log('Test 2: Generating single embedding...');
  const testText = 'Functions are reusable blocks of code that perform specific tasks.';
  const embedding = await getEmbedding(testText);
  
  console.log('✅ Generated embedding');
  console.log('   Text:', testText);
  console.log('   Dimensions:', embedding.length);
  console.log('   First 5 values:', embedding.slice(0, 5).map(v => v.toFixed(4)));
  console.log();

  // Test 3: Batch embeddings
  console.log('Test 3: Generating batch embeddings...');
  const texts = [
    'What are function parameters?',
    'How do I define a function?',
    'Explain return values in functions',
    'What is the difference between variables and constants?'
  ];

  const batchResults = await getBatchEmbeddings(texts, {
    onProgress: (current, total) => {
      console.log(`   Progress: ${current}/${total}`);
    },
    delayMs: 50
  });

  console.log('✅ Generated batch embeddings');
  console.log('   Total processed:', batchResults.length);
  console.log('   Successful:', batchResults.filter(r => !r.error).length);
  console.log('   Failed:', batchResults.filter(r => r.error).length);
  console.log();

  // Test 4: Similarity testing
  console.log('Test 4: Testing semantic similarity...');
  const query = 'How do parameters work?';
  const queryEmbedding = await getEmbedding(query);

  console.log(`Query: "${query}"\n`);
  console.log('Similarities with batch texts:');
  
  batchResults.forEach((result, i) => {
    if (!result.error) {
      const similarity = cosineSimilarity(queryEmbedding, result.embedding);
      console.log(`   ${(similarity * 100).toFixed(1)}% - "${texts[i]}"`);
    }
  });
  console.log();

  // Test 5: Verify dimensions match database
  console.log('Test 5: Database compatibility check...');
  const expectedDim = getEmbeddingDimensions();
  const actualDim = embedding.length;
  
  if (actualDim === expectedDim) {
    console.log(`✅ Dimensions match: ${actualDim}`);
    console.log('   ⚠️  NOTE: Your lesson_chunks table is set to vector(1536)');
    console.log('   You need to update it to vector(768) for nomic-embed-text');
    console.log('   Run this SQL in Supabase:');
    console.log('   ALTER TABLE lesson_chunks ALTER COLUMN embedding TYPE vector(768);');
  } else {
    console.error(`❌ Dimension mismatch! Expected ${expectedDim}, got ${actualDim}`);
  }
  console.log();

  console.log('🎉 All tests completed!');
}

// Run tests
testEmbeddings().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
