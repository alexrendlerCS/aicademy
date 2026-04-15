/**
 * Test Hybrid RAG Implementation
 * Tests the new hybrid approach with appropriate lesson matches
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { generateSystemPrompt } from '../lib/ai-utils.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testHybridRAG() {
  console.log('🧪 Testing Hybrid RAG Implementation\n');
  console.log('═'.repeat(80));
  
  // Test cases with appropriate lesson matches
  const testCases = [
    {
      query: "How do loops work?",
      lessonTitle: "Loops and Iteration",
      description: "Programming question → Programming lesson"
    },
    {
      query: "What are variables?",
      lessonTitle: "Variables and Data Types",
      description: "Programming question → Programming lesson"
    },
    {
      query: "Tell me about climate patterns",
      lessonTitle: "Global Climate Patterns",
      description: "Science question → Science lesson"
    },
  ];
  
  // Get a student ID
  const { data: students } = await supabase
    .from('student_modules')
    .select('student_id')
    .limit(1);
  
  const studentId = students?.[0]?.student_id || '00000000-0000-0000-0000-000000000001';
  
  for (const test of testCases) {
    console.log(`\n📝 Test: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected Lesson: ${test.lessonTitle}`);
    console.log('-'.repeat(80));
    
    // Find the lesson
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, module_id, content')
      .ilike('title', `%${test.lessonTitle}%`)
      .limit(1);
    
    if (!lessons || lessons.length === 0) {
      console.log('   ❌ Lesson not found\n');
      continue;
    }
    
    const lesson = lessons[0];
    const originalContentLength = lesson.content?.length || 0;
    
    console.log(`   ✅ Found lesson: "${lesson.title}"`);
    console.log(`   Original content: ${originalContentLength} chars\n`);
    
    // Test WITH query (Hybrid RAG)
    console.log('   🔍 Testing WITH query (Hybrid RAG)...');
    const promptWithRAG = await generateSystemPrompt(
      {
        userId: studentId,
        moduleId: lesson.module_id,
        lessonId: lesson.id,
      },
      test.query
    );
    
    // Extract just the relevant content section
    const ragContentMatch = promptWithRAG.match(/- Relevant lesson content: ([\s\S]*?)- Recent progress:/);
    const ragContent = ragContentMatch ? ragContentMatch[1].trim() : '';
    const ragContentLength = ragContent.length;
    
    console.log(`   Result: ${ragContentLength} chars`);
    
    // Count sections
    const sectionCount = (ragContent.match(/\[Section \d+\]/g) || []).length;
    console.log(`   Sections retrieved: ${sectionCount}`);
    
    // Check similarity scores
    const similarityMatches = ragContent.match(/\((\d+\.\d+)% relevant\)/g);
    if (similarityMatches) {
      const similarities = similarityMatches.map(m => parseFloat(m.match(/(\d+\.\d+)/)?.[1] || '0'));
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      console.log(`   Average similarity: ${avgSimilarity.toFixed(1)}%`);
    }
    
    // Test WITHOUT query (fallback to full content)
    console.log('\n   📄 Testing WITHOUT query (Fallback)...');
    const promptWithoutRAG = await generateSystemPrompt({
      userId: studentId,
      moduleId: lesson.module_id,
      lessonId: lesson.id,
    });
    
    const noRagContentMatch = promptWithoutRAG.match(/- Relevant lesson content: ([\s\S]*?)- Recent progress:/);
    const noRagContent = noRagContentMatch ? noRagContentMatch[1].trim() : '';
    const noRagContentLength = noRagContent.length;
    
    console.log(`   Result: ${noRagContentLength} chars (full lesson)\n`);
    
    // Calculate improvement
    const reduction = ((1 - ragContentLength / noRagContentLength) * 100);
    const reductionLabel = reduction > 0 ? `${reduction.toFixed(1)}% reduction ✅` : `${Math.abs(reduction).toFixed(1)}% increase ❌`;
    
    console.log(`   📊 Comparison:`);
    console.log(`      Hybrid RAG: ${ragContentLength} chars`);
    console.log(`      Full lesson: ${noRagContentLength} chars`);
    console.log(`      Improvement: ${reductionLabel}`);
    
    // Evaluate quality
    console.log(`\n   💡 Evaluation:`);
    if (sectionCount >= 1 && sectionCount <= 3) {
      console.log(`      ✅ Good section count (${sectionCount})`);
    } else {
      console.log(`      ⚠️  Unusual section count (${sectionCount})`);
    }
    
    if (reduction > 20) {
      console.log(`      ✅ Significant size reduction`);
    } else if (reduction > 0) {
      console.log(`      ⚠️  Modest size reduction`);
    } else {
      console.log(`      ❌ No size reduction (check query/lesson match)`);
    }
    
    console.log('\n' + '═'.repeat(80));
  }
  
  console.log('\n✅ Hybrid RAG test complete!\n');
  console.log('Expected behavior:');
  console.log('  - 1-3 sections retrieved per query');
  console.log('  - 50-70% average similarity');
  console.log('  - 30-60% size reduction vs full lesson');
  console.log('  - Content relevant to the query\n');
}

testHybridRAG().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
