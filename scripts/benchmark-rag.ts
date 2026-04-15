/**
 * RAG System Performance Benchmark
 * 
 * Generates professional metrics for resume/portfolio:
 * - Context size reduction %
 * - Retrieval accuracy
 * - Latency improvements
 * - Semantic similarity scores
 * - Cross-lesson contamination rate
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateSystemPrompt } from '../lib/ai-utils.js';
import { searchLessonChunks } from '../lib/rag/search-lesson-chunks.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Comprehensive test suite with verified lesson matches
const benchmarkTests = [
  // Programming queries
  { query: "How do loops work in programming?", expectedLesson: "Loops and Iteration", category: "Programming" },
  { query: "What are variables and data types?", expectedLesson: "Variables and Data Types", category: "Programming" },
  { query: "Explain the algorithm design process", expectedLesson: "Algorithm Design", category: "Programming" },
  { query: "How does pattern recognition work?", expectedLesson: "Pattern Recognition", category: "Programming" },
  { query: "What is problem decomposition?", expectedLesson: "Problem Decomposition", category: "Programming" },
  
  // Science queries
  { query: "Tell me about climate patterns", expectedLesson: "Global Climate Patterns", category: "Science" },
  { query: "What is scientific thinking?", expectedLesson: "What is Scientific Thinking?", category: "Science" },
  { query: "How does Earth's position in the solar system affect us?", expectedLesson: "Earth in the Solar System", category: "Science" },
  { query: "What are sustainable practices?", expectedLesson: "Sustainable Practices", category: "Science" },
  { query: "Explain how cells work", expectedLesson: "Understanding Cells", category: "Science" },
  
  // Writing/Creative queries
  { query: "How do I structure a story?", expectedLesson: "The Three-Act Structure", category: "Creative Writing" },
  { query: "What is show don't tell in writing?", expectedLesson: "Show, Don't Tell", category: "Creative Writing" },
  { query: "How do I create conflict in a story?", expectedLesson: "Creating Conflict", category: "Creative Writing" },
  { query: "Tell me about dialogue and voice", expectedLesson: "Dialogue and Voice", category: "Creative Writing" },
  
  // Reading/Comprehension queries
  { query: "How do I read for meaning?", expectedLesson: "Understanding What You Read", category: "Reading" },
  { query: "What is the author's purpose?", expectedLesson: "Reading Between the Lines: Finding the Author's Purpose", category: "Reading" },
  
  // Math queries
  { query: "Why do math operations matter?", expectedLesson: "Why Math Operations Matter", category: "Math" },
  { query: "How is math used in real life?", expectedLesson: "Real-Life Math Applications", category: "Math" },
  { query: "What is arithmetic?", expectedLesson: "Understanding Arithmetic", category: "Math" },
];

interface BenchmarkResult {
  query: string;
  expectedLesson: string;
  category: string;
  lessonFound: boolean;
  
  // RAG metrics
  ragChunksRetrieved: number;
  ragContentLength: number;
  ragLatency: number;
  avgSimilarity: number;
  topSimilarity: number;
  
  // Baseline metrics
  fullContentLength: number;
  fullLatency: number;
  
  // Calculated metrics
  sizeReduction: number;
  latencyChange: number;
  accuracy: number; // % of chunks from expected lesson
  crossLessonContamination: number; // % of chunks from other lessons
}

async function runBenchmark() {
  console.log('📊 RAG System Performance Benchmark\n');
  console.log('═'.repeat(100));
  console.log('Generating professional metrics for resume/portfolio...\n');
  
  const results: BenchmarkResult[] = [];
  const studentId = '00000000-0000-0000-0000-000000000001'; // Dummy student ID
  
  let testNum = 0;
  for (const test of benchmarkTests) {
    testNum++;
    process.stdout.write(`\r[${testNum}/${benchmarkTests.length}] Testing: "${test.query.substring(0, 50)}..."`);
    
    // Find the lesson
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, module_id, content')
      .ilike('title', `%${test.expectedLesson}%`)
      .limit(1);
    
    if (!lessons || lessons.length === 0) {
      results.push({
        query: test.query,
        expectedLesson: test.expectedLesson,
        category: test.category,
        lessonFound: false,
        ragChunksRetrieved: 0,
        ragContentLength: 0,
        ragLatency: 0,
        avgSimilarity: 0,
        topSimilarity: 0,
        fullContentLength: 0,
        fullLatency: 0,
        sizeReduction: 0,
        latencyChange: 0,
        accuracy: 0,
        crossLessonContamination: 0,
      });
      continue;
    }
    
    const lesson = lessons[0];
    
    // Measure RAG approach (with query)
    const ragStart = Date.now();
    const ragPrompt = await generateSystemPrompt(
      { userId: studentId, moduleId: lesson.module_id, lessonId: lesson.id },
      test.query
    );
    const ragLatency = Date.now() - ragStart;
    
    // Get detailed chunk info
    const chunks = await searchLessonChunks({
      query: test.query,
      lessonId: lesson.id,
      matchCount: 3,
      matchThreshold: 0.5,
      useServiceRole: true,
    });
    
    // If less than 2, try module fallback
    let finalChunks = chunks;
    if (chunks.length < 2) {
      const moduleChunks = await searchLessonChunks({
        query: test.query,
        moduleId: lesson.module_id,
        matchCount: 3,
        matchThreshold: 0.4,
        useServiceRole: true,
      });
      const existingIds = new Set(chunks.map(c => c.id));
      const newChunks = moduleChunks.filter(c => !existingIds.has(c.id));
      finalChunks = [...chunks, ...newChunks].slice(0, 3);
    }
    
    const ragContentMatch = ragPrompt.match(/- Relevant lesson content: ([\s\S]*?)- Recent progress:/);
    const ragContent = ragContentMatch ? ragContentMatch[1].trim() : '';
    
    // Measure baseline approach (without query)
    const fullStart = Date.now();
    const fullPrompt = await generateSystemPrompt({
      userId: studentId,
      moduleId: lesson.module_id,
      lessonId: lesson.id,
    });
    const fullLatency = Date.now() - fullStart;
    
    const fullContentMatch = fullPrompt.match(/- Relevant lesson content: ([\s\S]*?)- Recent progress:/);
    const fullContent = fullContentMatch ? fullContentMatch[1].trim() : '';
    
    // Calculate metrics
    const chunksFromExpected = finalChunks.filter(c => c.lessonId === lesson.id).length;
    const accuracy = finalChunks.length > 0 ? (chunksFromExpected / finalChunks.length) * 100 : 0;
    const crossLessonContamination = 100 - accuracy;
    
    const avgSimilarity = finalChunks.length > 0
      ? finalChunks.reduce((sum, c) => sum + c.similarity, 0) / finalChunks.length * 100
      : 0;
    
    const topSimilarity = finalChunks.length > 0 ? finalChunks[0].similarity * 100 : 0;
    
    const sizeReduction = fullContent.length > 0
      ? ((fullContent.length - ragContent.length) / fullContent.length) * 100
      : 0;
    
    const latencyChange = fullLatency > 0
      ? ((ragLatency - fullLatency) / fullLatency) * 100
      : 0;
    
    results.push({
      query: test.query,
      expectedLesson: test.expectedLesson,
      category: test.category,
      lessonFound: true,
      ragChunksRetrieved: finalChunks.length,
      ragContentLength: ragContent.length,
      ragLatency,
      avgSimilarity,
      topSimilarity,
      fullContentLength: fullContent.length,
      fullLatency,
      sizeReduction,
      latencyChange,
      accuracy,
      crossLessonContamination,
    });
  }
  
  console.log('\r' + ' '.repeat(100) + '\r'); // Clear progress line
  console.log('✅ Benchmark complete!\n');
  console.log('═'.repeat(100));
  
  // Calculate aggregate metrics
  const validResults = results.filter(r => r.lessonFound);
  
  const avgSizeReduction = validResults.reduce((sum, r) => sum + r.sizeReduction, 0) / validResults.length;
  const avgLatencyChange = validResults.reduce((sum, r) => sum + r.latencyChange, 0) / validResults.length;
  const avgAccuracy = validResults.reduce((sum, r) => sum + r.accuracy, 0) / validResults.length;
  const avgSimilarity = validResults.reduce((sum, r) => sum + r.avgSimilarity, 0) / validResults.length;
  const avgChunks = validResults.reduce((sum, r) => sum + r.ragChunksRetrieved, 0) / validResults.length;
  const avgCrossContamination = validResults.reduce((sum, r) => sum + r.crossLessonContamination, 0) / validResults.length;
  
  const totalRAGTokens = validResults.reduce((sum, r) => sum + Math.ceil(r.ragContentLength / 4), 0);
  const totalFullTokens = validResults.reduce((sum, r) => sum + Math.ceil(r.fullContentLength / 4), 0);
  const tokenSavings = totalFullTokens - totalRAGTokens;
  const tokenSavingsPercent = (tokenSavings / totalFullTokens) * 100;
  
  // Performance by category
  const categories = [...new Set(validResults.map(r => r.category))];
  const categoryStats = categories.map(cat => {
    const catResults = validResults.filter(r => r.category === cat);
    return {
      category: cat,
      count: catResults.length,
      avgReduction: catResults.reduce((sum, r) => sum + r.sizeReduction, 0) / catResults.length,
      avgAccuracy: catResults.reduce((sum, r) => sum + r.accuracy, 0) / catResults.length,
      avgSimilarity: catResults.reduce((sum, r) => sum + r.avgSimilarity, 0) / catResults.length,
    };
  });
  
  // Print results
  console.log('\n📈 PROFESSIONAL METRICS (Resume-Ready)\n');
  console.log('═'.repeat(100));
  
  console.log('\n🎯 Key Performance Indicators:\n');
  console.log(`  Context Size Reduction:        ${avgSizeReduction.toFixed(1)}%`);
  console.log(`  Retrieval Accuracy:            ${avgAccuracy.toFixed(1)}%`);
  console.log(`  Average Semantic Similarity:   ${avgSimilarity.toFixed(1)}%`);
  console.log(`  Cross-Lesson Contamination:    ${avgCrossContamination.toFixed(1)}%`);
  console.log(`  Average Chunks Retrieved:      ${avgChunks.toFixed(1)}`);
  console.log(`  Latency Change:                ${avgLatencyChange >= 0 ? '+' : ''}${avgLatencyChange.toFixed(1)}%`);
  
  console.log('\n💰 Token Economics:\n');
  console.log(`  Total Tests:                   ${validResults.length}`);
  console.log(`  Total Tokens (RAG):            ${totalRAGTokens.toLocaleString()}`);
  console.log(`  Total Tokens (Baseline):       ${totalFullTokens.toLocaleString()}`);
  console.log(`  Tokens Saved:                  ${tokenSavings.toLocaleString()} (${tokenSavingsPercent.toFixed(1)}%)`);
  console.log(`  Avg Tokens per Query (RAG):    ${Math.ceil(totalRAGTokens / validResults.length)}`);
  console.log(`  Avg Tokens per Query (Full):   ${Math.ceil(totalFullTokens / validResults.length)}`);
  
  console.log('\n📊 Performance by Category:\n');
  categoryStats.forEach(cat => {
    console.log(`  ${cat.category}:`);
    console.log(`    Tests:              ${cat.count}`);
    console.log(`    Avg Reduction:      ${cat.avgReduction.toFixed(1)}%`);
    console.log(`    Avg Accuracy:       ${cat.avgAccuracy.toFixed(1)}%`);
    console.log(`    Avg Similarity:     ${cat.avgSimilarity.toFixed(1)}%`);
    console.log('');
  });
  
  console.log('═'.repeat(100));
  
  console.log('\n📝 RESUME BULLET POINTS:\n');
  console.log('Copy these for your resume/portfolio:\n');
  console.log(`• Implemented RAG system achieving ${avgSizeReduction.toFixed(0)}% reduction in context size while maintaining ${avgAccuracy.toFixed(0)}% retrieval accuracy`);
  console.log(`• Optimized AI chatbot with hybrid vector search, reducing token usage by ${tokenSavingsPercent.toFixed(0)}% (~${Math.ceil(tokenSavings / validResults.length)} tokens per query)`);
  console.log(`• Built semantic search using PostgreSQL pgvector and Ollama embeddings (768-dim), achieving ${avgSimilarity.toFixed(0)}% average similarity`);
  console.log(`• Designed 2-tier retrieval strategy (lesson → module fallback) with ${(100 - avgCrossContamination).toFixed(0)}% precision`);
  console.log(`• Benchmarked across ${validResults.length} queries spanning ${categories.length} subject areas (${categories.join(', ')})`);
  
  console.log('\n💼 PORTFOLIO DESCRIPTION:\n');
  console.log(`Developed a production-ready Retrieval-Augmented Generation (RAG) system for an educational`);
  console.log(`AI chatbot. The system uses semantic vector search to retrieve only relevant lesson content,`);
  console.log(`reducing context size by ${avgSizeReduction.toFixed(0)}% while maintaining ${avgAccuracy.toFixed(0)}% accuracy. Implemented hybrid retrieval`);
  console.log(`with dual thresholds (0.5 in-lesson, 0.4 module-wide) and PostgreSQL pgvector for efficient`);
  console.log(`similarity search. Benchmarked across ${validResults.length} diverse queries, achieving ${avgSimilarity.toFixed(0)}% average semantic`);
  console.log(`similarity and ${tokenSavingsPercent.toFixed(0)}% token cost reduction.`);
  
  console.log('\n═'.repeat(100));
  console.log('\n✅ Benchmark complete! Metrics saved for resume.\n');
  
  // Save detailed results to file
  const fs = await import('fs');
  const reportPath = './RAG_BENCHMARK_RESULTS.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      avgSizeReduction,
      avgAccuracy,
      avgSimilarity,
      avgCrossContamination,
      avgChunks,
      avgLatencyChange,
      totalRAGTokens,
      totalFullTokens,
      tokenSavings,
      tokenSavingsPercent,
    },
    categoryStats,
    detailedResults: results,
    timestamp: new Date().toISOString(),
  }, null, 2));
  
  console.log(`📄 Detailed results saved to: ${reportPath}\n`);
}

runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
