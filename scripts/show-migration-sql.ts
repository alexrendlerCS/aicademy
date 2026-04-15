import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('📦 Applying subject filtering migration\n');
  console.log('This will update the search_lesson_chunks function to support subject filtering.\n');
  
  const sql = fs.readFileSync('./supabase/migrations/20240414_add_subject_filtering.sql', 'utf-8');
  
  console.log('SQL to execute:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n⚠️  Please copy the SQL above and run it in your Supabase SQL Editor:\n');
  console.log(`  1. Go to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/sql`);
  console.log(`  2. Paste the SQL above`);
  console.log(`  3. Click "Run"`);
  console.log(`  4. Then run the benchmark again\n`);
}

applyMigration();
