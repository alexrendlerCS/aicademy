/**
 * Generate and store embeddings for all lesson chunks
 * 
 * This script:
 * 1. Fetches all lessons from Supabase
 * 2. Chunks each lesson using our chunking utility
 * 3. Generates embeddings for each chunk using Ollama
 * 4. Stores chunks + embeddings in the lesson_chunks table
 * 
 * Run with: pnpm tsx scripts/generate-lesson-embeddings.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { chunkLessonContent } from '../lib/rag/chunk-lessons';
import { getBatchEmbeddings, checkOllamaEmbeddingModel } from '../lib/rag/embeddings';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Make sure .env.local exists with:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_url_here');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_key_here (for admin access)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order_index: number;
}

async function main() {
  console.log('🚀 Lesson Embedding Generation Script\n');

  // Step 1: Check Ollama setup
  console.log('Step 1: Verifying Ollama setup...');
  const status = await checkOllamaEmbeddingModel();
  
  if (!status.isRunning || !status.hasModel) {
    console.error('❌ Ollama setup issue:');
    console.error('   ', status.error);
    process.exit(1);
  }
  
  console.log('✅ Ollama ready:', status.modelInfo?.name);
  console.log();

  // Step 2: Fetch all lessons
  console.log('Step 2: Fetching lessons from database...');
  const { data: lessons, error: fetchError } = await supabase
    .from('lessons')
    .select('id, module_id, title, content, order_index')
    .order('module_id, order_index');

  if (fetchError) {
    console.error('❌ Error fetching lessons:', fetchError);
    process.exit(1);
  }

  if (!lessons || lessons.length === 0) {
    console.log('⚠️  No lessons found in database');
    process.exit(0);
  }

  console.log(`✅ Found ${lessons.length} lessons`);
  console.log();

  // Step 3: Process each lesson
  console.log('Step 3: Processing lessons...\n');
  
  let totalChunks = 0;
  let successfulChunks = 0;
  let failedChunks = 0;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    console.log(`[${i + 1}/${lessons.length}] Processing: "${lesson.title}"`);

    // Skip lessons with no content
    if (!lesson.content || lesson.content.trim() === '') {
      console.log('   ⚠️  Skipping - no content');
      console.log();
      continue;
    }

    // Step 3a: Chunk the lesson
    const chunks = chunkLessonContent(lesson.content, {
      minChunkSize: 50,
      maxChunkSize: 300,
      preserveHeadings: true,
      includeMetadata: true,
    }).map((chunk, index) => ({
      ...chunk,
      chunkIndex: index,
    }));

    console.log(`   📄 Generated ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.log('   ⚠️  No chunks generated (content too short?)');
      console.log();
      continue;
    }

    // Step 3b: Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.chunkText);
    console.log('   🧠 Generating embeddings...');
    
    const embeddings = await getBatchEmbeddings(chunkTexts, {
      onProgress: (current, total) => {
        if (current % 5 === 0 || current === total) {
          process.stdout.write(`\r   Progress: ${current}/${total}`);
        }
      },
      delayMs: 100, // 100ms delay between requests
    });
    
    console.log(); // New line after progress

    // Step 3c: Store chunks in database
    console.log('   💾 Storing in database...');
    
    for (let j = 0; j < chunks.length; j++) {
      const chunk = chunks[j];
      const embeddingResult = embeddings[j];

      if (embeddingResult.error) {
        console.log(`   ❌ Chunk ${j} embedding failed: ${embeddingResult.error}`);
        failedChunks++;
        continue;
      }

      // Insert chunk with embedding
      const { error: insertError } = await supabase
        .from('lesson_chunks')
        .insert({
          lesson_id: lesson.id,
          module_id: lesson.module_id,
          chunk_index: chunk.chunkIndex,
          section_title: chunk.sectionTitle || null,
          chunk_text: chunk.chunkText,
          metadata: chunk.metadata || {},
          embedding: embeddingResult.embedding,
        });

      if (insertError) {
        console.log(`   ❌ Failed to store chunk ${j}:`, insertError.message);
        failedChunks++;
      } else {
        successfulChunks++;
      }
    }

    totalChunks += chunks.length;
    console.log(`   ✅ Completed (${chunks.length} chunks stored)`);
    console.log();
  }

  // Step 4: Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   Lessons processed: ${lessons.length}`);
  console.log(`   Total chunks: ${totalChunks}`);
  console.log(`   ✅ Successful: ${successfulChunks}`);
  console.log(`   ❌ Failed: ${failedChunks}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (successfulChunks > 0) {
    console.log('\n🎉 Embedding generation complete!');
    console.log('   Your RAG system is ready to use.');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
