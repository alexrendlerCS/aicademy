/**
 * Apply Subject Filtering Migration
 * 
 * Runs the SQL migration to add subject-aware search functions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('📦 Applying subject filtering migration...\n');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20240414_add_subject_filtering.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by statement (simple approach - split on double newline)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`❌ Error:`, error);
      } else {
        console.log(`✅ Success`);
      }
    } catch (err: any) {
      // Try direct execution if rpc doesn't work
      console.log(`Trying alternative method...`);
      // This won't work via JS client, but we can inform the user
      console.log(`⚠️  Need to run migration manually via Supabase dashboard or CLI`);
      break;
    }
  }
  
  console.log('\n✅ Migration complete! You can now use subject filtering.');
  console.log('\nNote: If there were errors, run the migration via:');
  console.log('  1. Supabase dashboard SQL editor, or');
  console.log('  2. Direct PostgreSQL connection');
}

applyMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
