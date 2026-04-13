/**
 * Test script for vector search functionality
 * Run with: pnpm tsx lib/rag/test-search.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { 
  searchLessonChunks, 
  searchWithinModule,
  formatChunksForPrompt 
} from './search-lesson-chunks';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function testVectorSearch() {
  console.log('🔍 Testing Vector Search\n');

  // Test 1: General search
  console.log('Test 1: Searching for "What are functions?"\n');
  const results1 = await searchLessonChunks({
    query: "What are functions?",
    matchCount: 3,
    matchThreshold: 0.3,
    useServiceRole: true, // Use service role for testing
  });

  console.log(`Found ${results1.length} results:`);
  results1.forEach((chunk, i) => {
    console.log(`\n${i + 1}. ${chunk.sectionTitle || 'Untitled'}`);
    console.log(`   Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
    console.log(`   Preview: ${chunk.chunkText.substring(0, 100)}...`);
  });

  console.log('\n' + '━'.repeat(60) + '\n');

  // Test 2: Search within specific context
  console.log('Test 2: Searching for "loops and iteration"\n');
  const results2 = await searchLessonChunks({
    query: "How do loops work?",
    matchCount: 3,
    matchThreshold: 0.3,
    useServiceRole: true, // Use service role for testing
  });

  console.log(`Found ${results2.length} results:`);
  results2.forEach((chunk, i) => {
    console.log(`\n${i + 1}. ${chunk.sectionTitle || 'Untitled'}`);
    console.log(`   Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
    console.log(`   Preview: ${chunk.chunkText.substring(0, 100)}...`);
  });

  console.log('\n' + '━'.repeat(60) + '\n');

  // Test 3: Format for prompt
  console.log('Test 3: Formatted output for AI prompt\n');
  const results3 = await searchLessonChunks({
    query: "Tell me about scientific thinking",
    matchCount: 2,
    matchThreshold: 0.3,
    useServiceRole: true, // Use service role for testing
  });

  const formatted = formatChunksForPrompt(results3);
  console.log('Formatted for prompt:\n');
  console.log(formatted);

  console.log('\n' + '━'.repeat(60) + '\n');

  // Test 4: Low similarity query
  console.log('Test 4: Testing with unrelated query\n');
  const results4 = await searchLessonChunks({
    query: "quantum physics and string theory",
    matchCount: 3,
    matchThreshold: 0.3,
    useServiceRole: true, // Use service role for testing
  });

  console.log(`Found ${results4.length} results:`);
  if (results4.length > 0) {
    results4.forEach((chunk, i) => {
      console.log(`\n${i + 1}. ${chunk.sectionTitle || 'Untitled'}`);
      console.log(`   Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
      console.log(`   (Note: Low similarity expected for unrelated topic)`);
    });
  } else {
    console.log('✅ No results found (as expected for unrelated topic)');
  }

  console.log('\n🎉 Vector search tests complete!');
}

// Run tests
testVectorSearch().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
