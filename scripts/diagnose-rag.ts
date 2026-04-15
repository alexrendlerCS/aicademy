/**
 * RAG Diagnostic Test
 * 
 * This script helps us understand what's going wrong with RAG retrieval
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { searchLessonChunks } from '../lib/rag/search-lesson-chunks.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnoseRAG() {
  console.log('🔍 RAG Diagnostic Report\n');
  console.log('═'.repeat(80));
  
  // Step 1: Check what lessons we have with chunks
  console.log('\n📚 STEP 1: Available Lessons with Chunks\n');
  
  const { data: chunks } = await supabase
    .from('lesson_chunks')
    .select('lesson_id, module_id, section_title, chunk_text')
    .limit(100);
  
  if (!chunks) {
    console.log('❌ No chunks found!');
    return;
  }
  
  // Get unique lessons
  const lessonIds = [...new Set(chunks.map(c => c.lesson_id))];
  console.log(`Found ${chunks.length} total chunks across ${lessonIds.length} lessons\n`);
  
  // Get lesson details
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content')
    .in('id', lessonIds);
  
  if (lessons) {
    console.log('Lessons with chunks:');
    lessons.forEach((lesson, i) => {
      const chunkCount = chunks.filter(c => c.lesson_id === lesson.id).length;
      const contentLength = lesson.content?.length || 0;
      console.log(`  ${i + 1}. "${lesson.title}" - ${chunkCount} chunks, ${contentLength} chars`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  
  // Step 2: Test different queries with different thresholds
  console.log('\n🎯 STEP 2: Query Testing with Different Thresholds\n');
  
  const testQueries = [
    { query: "How do loops work?", expectedLesson: "Loops and Iteration" },
    { query: "What are variables?", expectedLesson: "Variables and Data Types" },
    { query: "Tell me about functions", expectedLesson: "Functions and Modularity" },
    { query: "How does climate work?", expectedLesson: "Global Climate Patterns" },
  ];
  
  const thresholds = [0.3, 0.4, 0.5, 0.6];
  
  for (const test of testQueries) {
    console.log(`\nQuery: "${test.query}"`);
    console.log(`Expected: ${test.expectedLesson}`);
    console.log('-'.repeat(80));
    
    for (const threshold of thresholds) {
      const results = await searchLessonChunks({
        query: test.query,
        matchCount: 5,
        matchThreshold: threshold,
        useServiceRole: true,
      });
      
      if (results.length > 0) {
        // Get lesson title for first result
        const firstLesson = lessons?.find(l => l.id === results[0].lessonId);
        const allSamLesson = results.every(r => r.lessonId === results[0].lessonId);
        const avgSimilarity = (results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1);
        
        console.log(`  Threshold ${threshold}: ${results.length} results, avg ${avgSimilarity}% similarity`);
        console.log(`    → Lesson: "${firstLesson?.title}"`);
        console.log(`    → All from same lesson: ${allSamLesson ? '✅' : '❌'}`);
        
        // Check for duplicates
        const uniqueTexts = new Set(results.map(r => r.chunkText.substring(0, 100)));
        if (uniqueTexts.size !== results.length) {
          console.log(`    → ⚠️  DUPLICATES FOUND! ${results.length} results but only ${uniqueTexts.size} unique`);
        }
      } else {
        console.log(`  Threshold ${threshold}: 0 results (threshold too high)`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  
  // Step 3: Check for duplicate chunks in database
  console.log('\n🔎 STEP 3: Checking for Duplicate Chunks\n');
  
  const chunkTexts = chunks.map(c => c.chunk_text);
  const uniqueChunks = new Set(chunkTexts);
  
  console.log(`Total chunks in DB: ${chunks.length}`);
  console.log(`Unique chunk texts: ${uniqueChunks.size}`);
  
  if (uniqueChunks.size < chunks.length) {
    console.log(`⚠️  Found ${chunks.length - uniqueChunks.size} duplicate chunks!`);
    
    // Find which chunks are duplicated
    const textCounts = new Map<string, number>();
    chunks.forEach(c => {
      const preview = c.chunk_text.substring(0, 50);
      textCounts.set(preview, (textCounts.get(preview) || 0) + 1);
    });
    
    console.log('\nDuplicated chunks:');
    let count = 0;
    for (const [text, occurrences] of textCounts) {
      if (occurrences > 1) {
        console.log(`  ${++count}. "${text}..." (${occurrences} times)`);
        if (count >= 5) {
          console.log(`  ... and ${[...textCounts.values()].filter(v => v > 1).length - 5} more`);
          break;
        }
      }
    }
  } else {
    console.log('✅ No duplicate chunks found');
  }
  
  console.log('\n' + '═'.repeat(80));
  
  // Step 4: Recommendations
  console.log('\n💡 STEP 4: Recommendations\n');
  
  console.log('Based on the diagnostic:');
  console.log('1. Check if duplicate chunks exist in the database');
  console.log('2. Identify the optimal similarity threshold (likely 0.4-0.5)');
  console.log('3. Verify queries match the correct lessons');
  console.log('4. Consider deduplication in the search function');
  
  console.log('\n✅ Diagnostic complete!\n');
}

diagnoseRAG().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
