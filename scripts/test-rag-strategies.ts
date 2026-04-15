/**
 * RAG Strategy Comparison Test
 * 
 * Tests three different approaches to see which works best:
 * A) Higher threshold only (0.5)
 * B) Lesson-filtered search
 * C) Hybrid approach (higher threshold + lesson priority)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { searchLessonChunks } from '../lib/rag/search-lesson-chunks.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test queries with known lessons
const testCases = [
  {
    query: "How do loops work?",
    expectedLesson: "Loops and Iteration",
    lessonId: null as string | null,
  },
  {
    query: "What are variables?",
    expectedLesson: "Variables and Data Types",
    lessonId: null as string | null,
  },
  {
    query: "How does climate work?",
    expectedLesson: "Global Climate Patterns",
    lessonId: null as string | null,
  },
  {
    query: "Tell me about story structure",
    expectedLesson: "The Three-Act Structure",
    lessonId: null as string | null,
  },
];

async function setupTestCases() {
  // Get actual lesson IDs for our test cases
  for (const test of testCases) {
    const { data } = await supabase
      .from('lessons')
      .select('id')
      .ilike('title', `%${test.expectedLesson}%`)
      .limit(1);
    
    if (data && data[0]) {
      test.lessonId = data[0].id;
    }
  }
}

async function testOptionA(test: typeof testCases[0]) {
  // Option A: Higher threshold (0.5), no lesson filter
  const results = await searchLessonChunks({
    query: test.query,
    matchCount: 5,
    matchThreshold: 0.5,
    useServiceRole: true,
  });
  
  return {
    name: "A: High Threshold (0.5)",
    count: results.length,
    avgSimilarity: results.length > 0 
      ? (results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)
      : '0',
    fromExpectedLesson: results.filter(r => r.lessonId === test.lessonId).length,
    totalChars: results.reduce((sum, r) => sum + r.chunkText.length, 0),
    topResult: results[0] ? {
      similarity: (results[0].similarity * 100).toFixed(1),
      lessonId: results[0].lessonId,
      preview: results[0].chunkText.substring(0, 60) + '...',
    } : null,
  };
}

async function testOptionB(test: typeof testCases[0]) {
  // Option B: Lesson-filtered search (0.3 threshold)
  if (!test.lessonId) {
    return {
      name: "B: Lesson Filter",
      count: 0,
      avgSimilarity: '0',
      fromExpectedLesson: 0,
      totalChars: 0,
      topResult: null,
      error: 'No lesson ID available',
    };
  }
  
  const results = await searchLessonChunks({
    query: test.query,
    lessonId: test.lessonId,
    matchCount: 5,
    matchThreshold: 0.3,
    useServiceRole: true,
  });
  
  return {
    name: "B: Lesson Filter (0.3)",
    count: results.length,
    avgSimilarity: results.length > 0
      ? (results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)
      : '0',
    fromExpectedLesson: results.length, // All should be from expected lesson
    totalChars: results.reduce((sum, r) => sum + r.chunkText.length, 0),
    topResult: results[0] ? {
      similarity: (results[0].similarity * 100).toFixed(1),
      lessonId: results[0].lessonId,
      preview: results[0].chunkText.substring(0, 60) + '...',
    } : null,
  };
}

async function testOptionC(test: typeof testCases[0]) {
  // Option C: Hybrid - Try lesson first with 0.5, fallback to module with 0.4
  if (!test.lessonId) {
    return {
      name: "C: Hybrid",
      count: 0,
      avgSimilarity: '0',
      fromExpectedLesson: 0,
      totalChars: 0,
      topResult: null,
      error: 'No lesson ID available',
    };
  }
  
  // Step 1: Try within lesson with higher threshold
  let results = await searchLessonChunks({
    query: test.query,
    lessonId: test.lessonId,
    matchCount: 3,
    matchThreshold: 0.5,
    useServiceRole: true,
  });
  
  // Step 2: If we got fewer than 2 results, expand to module
  if (results.length < 2) {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('id', test.lessonId)
      .single();
    
    if (lessonData) {
      const moduleResults = await searchLessonChunks({
        query: test.query,
        moduleId: lessonData.module_id,
        matchCount: 3,
        matchThreshold: 0.4,
        useServiceRole: true,
      });
      
      // Merge and deduplicate
      const existingIds = new Set(results.map(r => r.id));
      const newResults = moduleResults.filter(r => !existingIds.has(r.id));
      results = [...results, ...newResults].slice(0, 3);
    }
  }
  
  return {
    name: "C: Hybrid (0.5→0.4)",
    count: results.length,
    avgSimilarity: results.length > 0
      ? (results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)
      : '0',
    fromExpectedLesson: results.filter(r => r.lessonId === test.lessonId).length,
    totalChars: results.reduce((sum, r) => sum + r.chunkText.length, 0),
    topResult: results[0] ? {
      similarity: (results[0].similarity * 100).toFixed(1),
      lessonId: results[0].lessonId,
      preview: results[0].chunkText.substring(0, 60) + '...',
    } : null,
  };
}

async function runComparison() {
  console.log('🧪 RAG Strategy Comparison Test\n');
  console.log('Testing 3 approaches with real data...\n');
  console.log('═'.repeat(100));
  
  await setupTestCases();
  
  for (const test of testCases) {
    console.log(`\n📝 Query: "${test.query}"`);
    console.log(`   Expected Lesson: ${test.expectedLesson}`);
    console.log(`   Lesson ID: ${test.lessonId ? test.lessonId.substring(0, 8) + '...' : 'NOT FOUND'}`);
    console.log('\n' + '-'.repeat(100));
    
    const [resultA, resultB, resultC] = await Promise.all([
      testOptionA(test),
      testOptionB(test),
      testOptionC(test),
    ]);
    
    // Display results in a table format
    const results = [resultA, resultB, resultC];
    
    console.log('\n  Strategy                 | Results | Avg Sim | From Expected | Total Chars');
    console.log('  ' + '-'.repeat(90));
    
    for (const result of results) {
      if ('error' in result) {
        console.log(`  ${result.name.padEnd(24)} | ERROR: ${result.error}`);
        continue;
      }
      
      const fromExpectedPct = result.count > 0 
        ? `${result.fromExpectedLesson}/${result.count} (${Math.round(result.fromExpectedLesson / result.count * 100)}%)`
        : '0/0';
      
      console.log(
        `  ${result.name.padEnd(24)} | ` +
        `${String(result.count).padStart(7)} | ` +
        `${String(result.avgSimilarity + '%').padStart(7)} | ` +
        `${fromExpectedPct.padStart(13)} | ` +
        `${String(result.totalChars).padStart(11)}`
      );
    }
    
    // Show top result preview for each
    console.log('\n  Top Results Preview:');
    for (const result of results) {
      if (result.topResult) {
        const isExpectedLesson = result.topResult.lessonId === test.lessonId;
        const checkmark = isExpectedLesson ? '✅' : '❌';
        console.log(`    ${checkmark} ${result.name}: ${result.topResult.similarity}% - "${result.topResult.preview}"`);
      } else {
        console.log(`    ❌ ${result.name}: No results`);
      }
    }
    
    console.log('\n' + '═'.repeat(100));
  }
  
  // Summary and recommendation
  console.log('\n\n📊 Summary & Recommendation:\n');
  console.log('Criteria to evaluate:');
  console.log('  1. ✅ Results from expected lesson (accuracy)');
  console.log('  2. 📊 Number of results (coverage)');
  console.log('  3. 🎯 Average similarity (relevance)');
  console.log('  4. 📏 Total characters (efficiency)\n');
  console.log('Best approach should:');
  console.log('  - Return 2-3 results from the EXPECTED lesson');
  console.log('  - Have 60%+ average similarity');
  console.log('  - Keep total chars under 1500 for efficiency');
  console.log('  - Avoid cross-lesson contamination\n');
  
  console.log('✅ Test complete! Review the results above to decide which strategy works best.\n');
}

runComparison().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
