/**
 * Test RAG-Enhanced System Prompt Generation
 * 
 * This script tests the updated generateSystemPrompt() function
 * to verify it correctly retrieves and formats relevant chunks.
 */

// Load environment variables FIRST, before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { generateSystemPrompt } from '../lib/ai-utils.js';
import { createClient } from '@supabase/supabase-js';

async function testRAGPrompt() {
  console.log('🧪 Testing RAG-Enhanced System Prompt\n');

  // Create supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: Get a real student, module, and lesson from the database
  console.log('Step 1: Fetching test data from database...');
  
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name')
    .limit(1);
  
  console.log('Students:', students?.length, 'Error:', studentError);
  
  // Get a lesson that has chunks
  const { data: chunks, error: chunkError } = await supabase
    .from('lesson_chunks')
    .select('lesson_id, module_id')
    .limit(1);
  
  console.log('Chunks:', chunks?.length, 'Error:', chunkError);
  
  if (!chunks?.[0]) {
    console.error('❌ No lesson chunks found in database');
    console.log('Run: pnpm tsx scripts/generate-lesson-embeddings.ts');
    return;
  }
  
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, module_id')
    .eq('id', chunks[0].lesson_id)
    .limit(1);
  
  console.log('Lessons:', lessons?.length, 'Error:', lessonError);

  if (!students?.[0] || !lessons?.[0]) {
    console.error('❌ Could not find test data in database');
    console.log('Using first chunk anyway for testing...');
    
    // Use dummy student ID for testing
    const testStudentId = students?.[0]?.id || '00000000-0000-0000-0000-000000000001';
    const testLesson = lessons?.[0] || { id: chunks[0].lesson_id, title: 'Test Lesson', module_id: chunks[0].module_id };
    
    await testWithData(testStudentId, testLesson);
    return;
  }

  const student = students[0];
  const lesson = lessons[0];
  
  console.log(`✅ Found student: ${student.name}`);
  console.log(`✅ Found lesson: ${lesson.title}\n`);
  
  await testWithData(student.id, lesson);
}

async function testWithData(studentId: string, lesson: any) {

  // Step 2: Test with a specific query about loops
  console.log('Step 2: Generating prompt with RAG search...');
  console.log('Query: "How do I use loops in programming?"\n');
  
  const promptWithRAG = await generateSystemPrompt(
    {
      userId: studentId,
      moduleId: lesson.module_id,
      lessonId: lesson.id,
    },
    "How do I use loops in programming?"
  );

  console.log('📄 Generated Prompt with RAG:');
  console.log('━'.repeat(80));
  console.log(promptWithRAG);
  console.log('━'.repeat(80));
  console.log('\n');

  // Step 3: Test without query (backward compatibility)
  console.log('Step 3: Testing backward compatibility (no query)...\n');
  
  const promptWithoutRAG = await generateSystemPrompt({
    userId: studentId,
    moduleId: lesson.module_id,
    lessonId: lesson.id,
  });

  console.log('📄 Generated Prompt without RAG (full content):');
  console.log('━'.repeat(80));
  console.log(promptWithoutRAG.substring(0, 500) + '...');
  console.log('━'.repeat(80));
  console.log('\n');

  // Step 4: Compare content lengths
  console.log('📊 Comparison:');
  console.log(`   With RAG (relevant chunks): ${promptWithRAG.length} characters`);
  console.log(`   Without RAG (full lesson): ${promptWithoutRAG.length} characters`);
  
  const reduction = ((1 - promptWithRAG.length / promptWithoutRAG.length) * 100).toFixed(1);
  console.log(`   Size reduction: ${reduction}%`);
  
  console.log('\n✅ RAG prompt generation test complete!');
}

testRAGPrompt().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
