import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const { data, error } = await supabase
    .from('lesson_chunks')
    .select('id, lesson_id')
    .limit(5);
  
  console.log('Chunks found:', data?.length || 0);
  console.log('Error:', error);
  
  if (data && data.length > 0) {
    data.forEach(c => {
      console.log(`- Chunk ${c.id.substring(0, 8)}... for lesson ${c.lesson_id.substring(0, 8)}...`);
    });
  }
})();
