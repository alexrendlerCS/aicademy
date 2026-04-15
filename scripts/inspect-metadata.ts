import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectMetadata() {
  console.log('🔍 Inspecting Existing Metadata in Database\n');
  console.log('═'.repeat(80));
  
  // Check lesson_chunks table schema
  console.log('\n📋 Lesson Chunks Table Structure:\n');
  const { data: chunks } = await supabase
    .from('lesson_chunks')
    .select('*')
    .limit(3);
  
  if (chunks && chunks.length > 0) {
    console.log('Sample chunk fields:');
    Object.keys(chunks[0]).forEach(key => {
      const value = chunks[0][key];
      const type = typeof value;
      const preview = type === 'string' ? value.substring(0, 50) : value;
      console.log(`  - ${key}: ${type} = ${JSON.stringify(preview)}`);
    });
  }
  
  // Check what data we can get from lessons table
  console.log('\n\n📚 Lessons Table Structure:\n');
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .limit(2);
  
  if (lessons && lessons.length > 0) {
    console.log('Sample lesson fields:');
    Object.keys(lessons[0]).forEach(key => {
      const value = lessons[0][key];
      const type = typeof value;
      const preview = type === 'string' ? value.substring(0, 50) : value;
      console.log(`  - ${key}: ${type} = ${JSON.stringify(preview)}`);
    });
  }
  
  // Check modules table for subject info
  console.log('\n\n🎓 Modules Table Structure:\n');
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .limit(3);
  
  if (modules && modules.length > 0) {
    console.log('Sample module fields:');
    Object.keys(modules[0]).forEach(key => {
      const value = modules[0][key];
      const type = typeof value;
      const preview = type === 'string' ? value.substring(0, 50) : value;
      console.log(`  - ${key}: ${type} = ${JSON.stringify(preview)}`);
    });
    
    console.log('\n\nAll modules with subjects:');
    modules.forEach(m => {
      console.log(`  - ${m.title} (ID: ${m.id?.substring(0, 8)}...)`);
      console.log(`    Subject: ${m.subject || 'N/A'}`);
    });
  }
  
  // Check if we can join to get subject info
  console.log('\n\n🔗 Joined Data (Chunks + Lessons + Modules):\n');
  const { data: joined } = await supabase
    .from('lesson_chunks')
    .select(`
      id,
      section_title,
      lesson_id,
      module_id,
      metadata,
      lessons (
        id,
        title,
        module_id
      ),
      modules (
        id,
        title,
        subject
      )
    `)
    .limit(5);
  
  if (joined && joined.length > 0) {
    console.log('Sample joined data:');
    joined.forEach((item, i) => {
      console.log(`\n${i + 1}. Chunk: ${item.section_title || 'Untitled'}`);
      console.log(`   Lesson: ${(item.lessons as any)?.title || 'N/A'}`);
      console.log(`   Module: ${(item.modules as any)?.title || 'N/A'}`);
      console.log(`   Subject: ${(item.modules as any)?.subject || 'N/A'}`);
      console.log(`   Metadata: ${JSON.stringify(item.metadata)}`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Inspection complete!\n');
}

inspectMetadata().catch(console.error);
