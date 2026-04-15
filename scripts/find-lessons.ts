import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findLessons() {
  console.log('🔍 Finding Lessons by Subject\n');
  
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, modules(subject)')
    .limit(100);
  
  const grouped: Record<string, any[]> = {};
  
  lessons?.forEach((lesson: any) => {
    const subject = lesson.modules?.subject || 'unknown';
    if (!grouped[subject]) grouped[subject] = [];
    grouped[subject].push({ id: lesson.id, title: lesson.title });
  });
  
  Object.entries(grouped).forEach(([subject, list]) => {
    console.log(`\n${subject}:`);
    list.slice(0, 5).forEach(l => {
      console.log(`  ${l.id} - ${l.title}`);
    });
  });
}

findLessons();
