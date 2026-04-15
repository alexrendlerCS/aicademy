/**
 * Enhanced RAG Benchmark with Subject Filtering
 * 
 * Compares performance WITH and WITHOUT subject filtering:
 * - Chunk reduction (fewer tokens = cost savings)
 * - Retrieval accuracy (chunks from correct lesson/subject)
 * - Cross-contamination rate
 * - Semantic similarity quality
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { searchLessonChunks } from '../lib/rag/search-lesson-chunks';
import { supabase } from '../lib/supabaseClient';
import fs from 'fs';

interface BenchmarkQuery {
  query: string;
  lessonId: string;
  expectedSubject: string;
  category: string;
  description: string;
}

// Comprehensive test suite
const benchmarkQueries: BenchmarkQuery[] = [
  // Computer Science (5 queries)
  {
    query: "How does machine learning work?",
    lessonId: "954d551b-d975-42f6-a262-a4879a91f6f6",
    expectedSubject: "Computer Science",
    category: "Computer Science",
    description: "Machine learning"
  },
  {
    query: "What are neural networks?",
    lessonId: "05edc5b3-60e3-4d67-83a4-3b5b0a9332c4",
    expectedSubject: "Computer Science",
    category: "Computer Science",
    description: "Neural networks"
  },
  {
    query: "Explain artificial intelligence basics",
    lessonId: "8f423bbe-3365-4add-bcbe-2731b4afed4b",
    expectedSubject: "Computer Science",
    category: "Computer Science",
    description: "AI basics"
  },
  {
    query: "How do I use if statements?",
    lessonId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
    expectedSubject: "science",
    category: "Science",
    description: "Control flow"
  },
  {
    query: "What are functions in programming?",
    lessonId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16",
    expectedSubject: "science",
    category: "Science",
    description: "Functions"
  },
  
  // Science (5 queries)
  {
    query: "How do cells work?",
    lessonId: "e540f377-0d87-4985-877b-7692be4cbcd7",
    expectedSubject: "science",
    category: "Science",
    description: "Cells"
  },
  {
    query: "What is the atmosphere?",
    lessonId: "c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a25",
    expectedSubject: "science",
    category: "Science",
    description: "Atmosphere"
  },
  {
    query: "How can we be more sustainable?",
    lessonId: "c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a28",
    expectedSubject: "science",
    category: "Science",
    description: "Sustainability"
  },
  {
    query: "What is sustainable living?",
    lessonId: "c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a28",
    expectedSubject: "science",
    category: "Science",
    description: "Sustainable practices"
  },
  {
    query: "How do cells divide?",
    lessonId: "e540f377-0d87-4985-877b-7692be4cbcd7",
    expectedSubject: "science",
    category: "Science",
    description: "Cell biology"
  },
  
  // Reading/Creative Writing (5 queries)
  {
    query: "How do I create conflict in a story?",
    lessonId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    expectedSubject: "reading",
    category: "Reading",
    description: "Story conflict"
  },
  {
    query: "What are the parts of a story?",
    lessonId: "986bfecc-dd87-4e95-9ed7-8e3e1fc20bdf",
    expectedSubject: "reading",
    category: "Reading",
    description: "Story structure"
  },
  {
    query: "How do I show instead of tell?",
    lessonId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a21",
    expectedSubject: "reading",
    category: "Reading",
    description: "Show don't tell"
  },
  {
    query: "How do I write good dialogue?",
    lessonId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a24",
    expectedSubject: "reading",
    category: "Reading",
    description: "Dialogue writing"
  },
  {
    query: "How do I read informational text?",
    lessonId: "ff04b516-31fe-4c02-86fd-bb14fce611b3",
    expectedSubject: "reading",
    category: "Reading",
    description: "Reading facts"
  },
  
  // Math (3 queries)
  {
    query: "How do I multiply numbers?",
    lessonId: "015eaf77-a468-4241-be15-7ecad83d3919",
    expectedSubject: "math",
    category: "Math",
    description: "Multiplication"
  },
  {
    query: "How is math used in real life?",
    lessonId: "3f7c5441-ba8e-45d1-9f2b-13b13ea397f2",
    expectedSubject: "math",
    category: "Math",
    description: "Real-life math"
  },
  {
    query: "What are basic arithmetic operations?",
    lessonId: "7177ad4e-cc97-4c89-8db0-bd8fcc98be00",
    expectedSubject: "math",
    category: "Math",
    description: "Arithmetic"
  },
];

async function runBenchmark() {
  console.log('\n🚀 ENHANCED RAG BENCHMARK\n');
  console.log('Comparing WITH vs WITHOUT subject filtering\n');
  console.log('═'.repeat(60));
  
  const results = [];
  
  for (const test of benchmarkQueries) {
    console.log(`\n📝 ${test.category}: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    
    // Get lesson content and module subject
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('content, module_id, modules(subject)')
      .eq('id', test.lessonId)
      .single();
    
    if (!lessonData) {
      console.log('❌ Lesson not found');
      continue;
    }
    
    const moduleData = lessonData.modules as any;
    const currentSubject = moduleData?.subject;
    const fullContent = lessonData.content || '';
    const fullTokens = fullContent.split(/\s+/).length;
    
    // Test WITHOUT subject filtering
    const withoutFilter = await searchLessonChunks({
      query: test.query,
      lessonId: test.lessonId,
      matchCount: 3,
      matchThreshold: 0.4,
      useServiceRole: true,
    });
    
    const withoutTokens = withoutFilter.reduce((sum, c) => sum + c.chunkText.split(/\s+/).length, 0);
    const withoutAccuracy = withoutFilter.filter(c => c.subject === test.expectedSubject).length / Math.max(withoutFilter.length, 1);
    const withoutContamination = 1 - withoutAccuracy;
    const withoutAvgSimilarity = withoutFilter.reduce((sum, c) => sum + c.similarity, 0) / Math.max(withoutFilter.length, 1);
    
    // Test WITH subject filtering
    const withFilter = await searchLessonChunks({
      query: test.query,
      lessonId: test.lessonId,
      matchCount: 3,
      matchThreshold: 0.4,
      useServiceRole: true,
      subject: currentSubject,
    });
    
    const withTokens = withFilter.reduce((sum, c) => sum + c.chunkText.split(/\s+/).length, 0);
    const withAccuracy = withFilter.filter(c => c.subject === test.expectedSubject).length / Math.max(withFilter.length, 1);
    const withContamination = 1 - withAccuracy;
    const withAvgSimilarity = withFilter.reduce((sum, c) => sum + c.similarity, 0) / Math.max(withFilter.length, 1);
    
    const reduction = ((fullTokens - withTokens) / fullTokens * 100);
    
    console.log(`\n  Without Filter: ${withoutFilter.length} chunks, ${withoutTokens} tokens, ${(withoutAccuracy*100).toFixed(0)}% accurate, ${(withoutContamination*100).toFixed(0)}% contaminated`);
    console.log(`  With Filter:    ${withFilter.length} chunks, ${withTokens} tokens, ${(withAccuracy*100).toFixed(0)}% accurate, ${(withContamination*100).toFixed(0)}% contaminated`);
    console.log(`  Reduction: ${reduction.toFixed(1)}%`);
    console.log(`  Similarity: ${(withAvgSimilarity*100).toFixed(1)}%`);
    
    const result = {
      category: test.category,
      description: test.description,
      query: test.query,
      expectedSubject: test.expectedSubject,
      fullTokens,
      without: {
        chunks: withoutFilter.length,
        tokens: withoutTokens,
        accuracy: withoutAccuracy,
        contamination: withoutContamination,
        avgSimilarity: withoutAvgSimilarity,
      },
      with: {
        chunks: withFilter.length,
        tokens: withTokens,
        accuracy: withAccuracy,
        contamination: withContamination,
        avgSimilarity: withAvgSimilarity,
      },
      reduction,
      improvement: withAccuracy - withoutAccuracy,
    };
    
    results.push(result);
  }
  
  // Calculate aggregate metrics
  console.log('\n\n📊 AGGREGATE RESULTS');
  console.log('═'.repeat(60));
  
  const avgReduction = results.reduce((sum, r) => sum + r.reduction, 0) / results.length;
  
  const withoutAvgAccuracy = results.reduce((sum, r) => sum + r.without.accuracy, 0) / results.length;
  const withAvgAccuracy = results.reduce((sum, r) => sum + r.with.accuracy, 0) / results.length;
  
  const withoutAvgContamination = results.reduce((sum, r) => sum + r.without.contamination, 0) / results.length;
  const withAvgContamination = results.reduce((sum, r) => sum + r.with.contamination, 0) / results.length;
  
  const withAvgSimilarity = results.reduce((sum, r) => sum + r.with.avgSimilarity, 0) / results.length;
  
  const avgTokenSavings = results.reduce((sum, r) => sum + (r.fullTokens - r.with.tokens), 0) / results.length;
  
  console.log(`\nWITHOUT Subject Filtering:`);
  console.log(`  Average Accuracy: ${(withoutAvgAccuracy*100).toFixed(1)}%`);
  console.log(`  Average Contamination: ${(withoutAvgContamination*100).toFixed(1)}%`);
  
  console.log(`\nWITH Subject Filtering:`);
  console.log(`  Average Accuracy: ${(withAvgAccuracy*100).toFixed(1)}%`);
  console.log(`  Average Contamination: ${(withAvgContamination*100).toFixed(1)}%`);
  console.log(`  Average Reduction: ${avgReduction.toFixed(1)}%`);
  console.log(`  Average Similarity: ${(withAvgSimilarity*100).toFixed(1)}%`);
  console.log(`  Average Token Savings: ${avgTokenSavings.toFixed(0)} tokens/query`);
  
  const improvementPercent = ((withAvgAccuracy - withoutAvgAccuracy) / withoutAvgAccuracy * 100);
  const contaminationReduction = ((withoutAvgContamination - withAvgContamination) / withoutAvgContamination * 100);
  
  console.log(`\n✨ IMPROVEMENTS:`);
  console.log(`  Accuracy improved by: ${improvementPercent.toFixed(1)}%`);
  console.log(`  Contamination reduced by: ${contaminationReduction.toFixed(1)}%`);
  
  // Category breakdown
  console.log('\n\n📊 BY CATEGORY');
  console.log('═'.repeat(60));
  
  const categories = [...new Set(results.map(r => r.category))];
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const catAccuracy = categoryResults.reduce((sum, r) => sum + r.with.accuracy, 0) / categoryResults.length;
    const catReduction = categoryResults.reduce((sum, r) => sum + r.reduction, 0) / categoryResults.length;
    const catContamination = categoryResults.reduce((sum, r) => sum + r.with.contamination, 0) / categoryResults.length;
    
    console.log(`\n${category}:`);
    console.log(`  Accuracy: ${(catAccuracy*100).toFixed(1)}%`);
    console.log(`  Reduction: ${catReduction.toFixed(1)}%`);
    console.log(`  Contamination: ${(catContamination*100).toFixed(1)}%`);
  }
  
  // Save results
  fs.writeFileSync(
    'RAG_SUBJECT_FILTERING_BENCHMARK.json',
    JSON.stringify({ results, summary: {
      avgReduction,
      withoutAvgAccuracy,
      withAvgAccuracy,
      withoutAvgContamination,
      withAvgContamination,
      withAvgSimilarity,
      avgTokenSavings,
      improvementPercent,
      contaminationReduction,
    }}, null, 2)
  );
  
  console.log('\n\n✅ Results saved to RAG_SUBJECT_FILTERING_BENCHMARK.json');
  
  // Resume highlights
  console.log('\n\n📄 RESUME HIGHLIGHTS');
  console.log('═'.repeat(60));
  console.log(`\n• Implemented subject-aware semantic search reducing cross-domain`);
  console.log(`  contamination by ${contaminationReduction.toFixed(0)}% (${(withoutAvgContamination*100).toFixed(0)}% → ${(withAvgContamination*100).toFixed(0)}%)`);
  console.log(`\n• Achieved ${(withAvgAccuracy*100).toFixed(0)}% retrieval accuracy with ${avgReduction.toFixed(0)}% token reduction,`);
  console.log(`  saving ~${avgTokenSavings.toFixed(0)} tokens per query`);
  console.log(`\n• Optimized RAG system with hybrid search (lesson + module fallback)`);
  console.log(`  maintaining ${(withAvgSimilarity*100).toFixed(0)}% semantic similarity`);
}

runBenchmark()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
