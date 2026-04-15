import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeEmbeddingCoverage() {
  console.log('📊 Analyzing RAG Coverage\n');
  
  // Get all lessons with their module info
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, modules(id, title, subject)')
    .order('modules(subject)');
  
  // Get all lesson_chunks
  const { data: chunks } = await supabase
    .from('lesson_chunks')
    .select('lesson_id');
  
  const chunkedLessonIds = new Set(chunks?.map(c => c.lesson_id) || []);
  
  const embedded: any[] = [];
  const notEmbedded: any[] = [];
  
  allLessons?.forEach((lesson: any) => {
    const moduleData = lesson.modules;
    const item = {
      id: lesson.id,
      title: lesson.title,
      moduleTitle: moduleData?.title,
      subject: moduleData?.subject,
    };
    
    if (chunkedLessonIds.has(lesson.id)) {
      embedded.push(item);
    } else {
      notEmbedded.push(item);
    }
  });
  
  console.log(`✅ EMBEDDED LESSONS (${embedded.length}):`);
  console.log('═'.repeat(60));
  
  const embeddedBySubject: Record<string, any[]> = {};
  embedded.forEach(l => {
    const subject = l.subject || 'unknown';
    if (!embeddedBySubject[subject]) embeddedBySubject[subject] = [];
    embeddedBySubject[subject].push(l);
  });
  
  Object.entries(embeddedBySubject).forEach(([subject, lessons]) => {
    console.log(`\n${subject.toUpperCase()} (${lessons.length}):`);
    lessons.forEach(l => {
      console.log(`  ✓ ${l.title}`);
    });
  });
  
  console.log(`\n\n❌ NOT EMBEDDED LESSONS (${notEmbedded.length}):`);
  console.log('═'.repeat(60));
  
  const notEmbeddedBySubject: Record<string, any[]> = {};
  notEmbedded.forEach(l => {
    const subject = l.subject || 'unknown';
    if (!notEmbeddedBySubject[subject]) notEmbeddedBySubject[subject] = [];
    notEmbeddedBySubject[subject].push(l);
  });
  
  Object.entries(notEmbeddedBySubject).forEach(([subject, lessons]) => {
    console.log(`\n${subject.toUpperCase()} (${lessons.length}):`);
    lessons.forEach(l => {
      console.log(`  ✗ ${l.title} (${l.id})`);
    });
  });
  
  // Summary
  console.log('\n\n📈 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Lessons: ${allLessons?.length || 0}`);
  console.log(`Embedded: ${embedded.length} (${(embedded.length / (allLessons?.length || 1) * 100).toFixed(1)}%)`);
  console.log(`Not Embedded: ${notEmbedded.length} (${(notEmbedded.length / (allLessons?.length || 1) * 100).toFixed(1)}%)`);
  
  console.log('\n\n🎯 NEXT STEPS:');
  console.log('Run the chunking and embedding process for the missing lessons.');
  console.log('This will allow comprehensive RAG testing across all subjects.\n');
  
  // Return lesson IDs that need embedding
  return notEmbedded.map(l => l.id);
}

analyzeEmbeddingCoverage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
