/**
 * Test Subject Filtering for RAG
 * 
 * This script tests the enhanced subject-aware search to verify:
 * 1. Cross-contamination is reduced when filtering by subject
 * 2. Only chunks from the correct subject are returned
 * 3. Accuracy improves while maintaining good reduction
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { searchLessonChunks } from '../lib/rag/search-lesson-chunks';
import { supabase } from '../lib/supabaseClient';

interface TestQuery {
  query: string;
  lessonId: string;
  expectedSubject: string;
  description: string;
}

// Test queries across different subjects
const testQueries: TestQuery[] = [
  // Programming
  {
    query: "How do I create a loop in JavaScript?",
    lessonId: "d59edc64-28a5-471f-8fb6-2f93eab9b6e3",
    expectedSubject: "Computer Science",
    description: "Programming - Loops"
  },
  {
    query: "What are variables and how do they work?",
    lessonId: "d59edc64-28a5-471f-8fb6-2f93eab9b6e3",
    expectedSubject: "Computer Science",
    description: "Programming - Variables"
  },
  
  // Science
  {
    query: "How does climate change affect the environment?",
    lessonId: "3bb4ee48-c53c-447e-b8bf-e8c1f6134620",
    expectedSubject: "science",
    description: "Science - Climate"
  },
  {
    query: "What is the scientific method?",
    lessonId: "3bb4ee48-c53c-447e-b8bf-e8c1f6134620",
    expectedSubject: "science",
    description: "Science - Method"
  },
  
  // Reading
  {
    query: "How do I understand main ideas in a text?",
    lessonId: "fb2c4e49-8870-4d42-8e7a-77ef3d1c0d62",
    expectedSubject: "reading",
    description: "Reading - Comprehension"
  }
];

async function runTest() {
  console.log('\n🧪 SUBJECT FILTERING TEST\n');
  console.log('Testing if subject filtering prevents cross-contamination...\n');
  
  let totalTests = 0;
  let accurateTests = 0;
  let contaminationCases = 0;
  
  for (const test of testQueries) {
    console.log(`\n📝 ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Expected Subject: ${test.expectedSubject}\n`);
    
    // Get module_id and subject from lesson
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('module_id, modules(subject)')
      .eq('id', test.lessonId)
      .single();
    
    if (!lessonData) {
      console.log('❌ Lesson not found');
      continue;
    }
    
    const moduleData = lessonData.modules as any;
    const currentSubject = moduleData?.subject;
    
    console.log(`Current Module Subject: ${currentSubject}`);
    
    // Test 1: Search WITHOUT subject filtering (baseline)
    console.log('\n--- WITHOUT Subject Filtering ---');
    const withoutFilter = await searchLessonChunks({
      query: test.query,
      lessonId: test.lessonId,
      matchCount: 3,
      matchThreshold: 0.4,
      useServiceRole: true,
    });
    
    console.log(`Results: ${withoutFilter.length} chunks`);
    const contaminatedWithout = withoutFilter.filter(c => c.subject !== test.expectedSubject);
    console.log(`Cross-contamination: ${contaminatedWithout.length}/${withoutFilter.length}`);
    
    if (contaminatedWithout.length > 0) {
      console.log('Contaminated subjects:', [...new Set(contaminatedWithout.map(c => c.subject))]);
    }
    
    // Test 2: Search WITH subject filtering
    console.log('\n--- WITH Subject Filtering ---');
    const withFilter = await searchLessonChunks({
      query: test.query,
      lessonId: test.lessonId,
      matchCount: 3,
      matchThreshold: 0.4,
      useServiceRole: true,
      subject: currentSubject,
    });
    
    console.log(`Results: ${withFilter.length} chunks`);
    const contaminatedWith = withFilter.filter(c => c.subject !== test.expectedSubject);
    console.log(`Cross-contamination: ${contaminatedWith.length}/${withFilter.length}`);
    
    const isAccurate = contaminatedWith.length === 0;
    
    if (isAccurate) {
      console.log('✅ All chunks from correct subject!');
      accurateTests++;
    } else {
      console.log('❌ Still has cross-contamination:');
      console.log('Contaminated subjects:', [...new Set(contaminatedWith.map(c => c.subject))]);
      contaminationCases++;
    }
    
    // Show improvement
    const improvement = contaminatedWithout.length - contaminatedWith.length;
    if (improvement > 0) {
      console.log(`📊 Improvement: Reduced contamination by ${improvement} chunks`);
    }
    
    totalTests++;
  }
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Accurate (0% contamination): ${accurateTests} (${(accurateTests/totalTests*100).toFixed(1)}%)`);
  console.log(`Still contaminated: ${contaminationCases} (${(contaminationCases/totalTests*100).toFixed(1)}%)`);
  console.log(`\nTarget: >90% accuracy`);
  
  if (accurateTests / totalTests >= 0.9) {
    console.log('✅ Subject filtering is working well!');
  } else {
    console.log('⚠️  Subject filtering needs more tuning');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
