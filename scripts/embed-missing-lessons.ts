/**
 * Embed Missing Lessons Only
 * 
 * This script embeds only the lessons that don't have chunks yet:
 * - 3 Computer Science lessons
 * - 1 Math lesson  
 * - 1 Reading lesson
 * - 5 Science lessons
 * 
 * Total: 10 lessons to embed
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { chunkLessonContent } from '../lib/rag/chunk-lessons';
import { getBatchEmbeddings, checkOllamaEmbeddingModel } from '../lib/rag/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lessons that need embedding (from analyze-rag-coverage.ts)
const MISSING_LESSON_IDS = [
  // Computer Science (3)
  '8f423bbe-3365-4add-bcbe-2731b4afed4b', // Understanding AI Basics
  '954d551b-d975-42f6-a262-a4879a91f6f6', // Machine Learning Fundamentals
  '05edc5b3-60e3-4d67-83a4-3b5b0a9332c4', // Neural Networks Introduction
  
  // Math (1)
  '015eaf77-a468-4241-be15-7ecad83d3919', // Basic Multiplication & Division
  
  // Reading (1)
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', // Character Motivation
  
  // Science (5)
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', // Control Flow - Making Decisions
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', // Functions and Modularity
  '4ab42a16-b349-4d3e-a795-edb2ae943b09', // How Scientists Think: A Step-by-Step Guide
  'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', // The Earth's Atmosphere
  'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', // Ecosystem Components
];

async function embedMissingLessons() {
  console.log('🚀 Embedding Missing Lessons\n');
  console.log(`Target: ${MISSING_LESSON_IDS.length} lessons\n`);
  
  // Step 1: Check Ollama
  console.log('Step 1: Verifying Ollama setup...');
  const status = await checkOllamaEmbeddingModel();
  
  if (!status.isRunning || !status.hasModel) {
    console.error('❌ Ollama setup issue:', status.error);
    console.error('\n💡 Start Ollama with: ollama serve');
    console.error('   Pull model with: ollama pull nomic-embed-text');
    process.exit(1);
  }
  
  console.log('✅ Ollama ready:', status.modelInfo?.name);
  console.log();
  
  // Step 2: Fetch lessons
  console.log('Step 2: Fetching lessons...');
  const { data: lessons, error: fetchError } = await supabase
    .from('lessons')
    .select('id, module_id, title, content, modules(subject)')
    .in('id', MISSING_LESSON_IDS);
  
  if (fetchError) {
    console.error('❌ Error fetching lessons:', fetchError);
    process.exit(1);
  }
  
  if (!lessons || lessons.length === 0) {
    console.log('⚠️  No lessons found');
    process.exit(0);
  }
  
  console.log(`✅ Found ${lessons.length}/${MISSING_LESSON_IDS.length} lessons`);
  console.log();
  
  // Step 3: Process each lesson
  console.log('Step 3: Processing lessons...\n');
  console.log('═'.repeat(60));
  
  let totalChunks = 0;
  let successfulChunks = 0;
  let failedChunks = 0;
  let skippedLessons = 0;
  
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i] as any;
    const moduleData = lesson.modules;
    const subject = moduleData?.subject || 'unknown';
    
    console.log(`\n[${i + 1}/${lessons.length}] ${lesson.title}`);
    console.log(`Subject: ${subject}`);
    
    // Skip if no content
    if (!lesson.content || lesson.content.trim() === '') {
      console.log('⚠️  Skipping - no content\n');
      skippedLessons++;
      continue;
    }
    
    const contentLength = lesson.content.length;
    console.log(`Content: ${contentLength} characters`);
    
    // Chunk the lesson
    const chunks = chunkLessonContent(lesson.content, {
      minChunkSize: 20,  // LOWERED: Some lessons have smaller semantic units
      maxChunkSize: 300,
      preserveHeadings: true,
      includeMetadata: true,
    }).map((chunk, index) => ({
      ...chunk,
      chunkIndex: index,
    }));
    
    console.log(`📄 Generated ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      console.log('⚠️  No chunks generated\n');
      skippedLessons++;
      continue;
    }
    
    // Generate embeddings
    const chunkTexts = chunks.map(c => c.chunkText);
    console.log('🧠 Generating embeddings...');
    
    const embeddings = await getBatchEmbeddings(chunkTexts, {
      onProgress: (current, total) => {
        process.stdout.write(`\r   Progress: ${current}/${total}`);
      },
      delayMs: 100,
    });
    
    console.log(); // New line
    
    // Store in database
    console.log('💾 Storing chunks...');
    
    for (let j = 0; j < chunks.length; j++) {
      const chunk = chunks[j];
      const embeddingResult = embeddings[j];
      
      if (embeddingResult.error) {
        console.log(`   ❌ Chunk ${j} failed: ${embeddingResult.error}`);
        failedChunks++;
        continue;
      }
      
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
    console.log(`✅ Completed: ${chunks.length} chunks stored`);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 EMBEDDING SUMMARY\n');
  console.log(`Lessons targeted: ${MISSING_LESSON_IDS.length}`);
  console.log(`Lessons found: ${lessons.length}`);
  console.log(`Lessons processed: ${lessons.length - skippedLessons}`);
  console.log(`Lessons skipped: ${skippedLessons}`);
  console.log();
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`✅ Successful: ${successfulChunks}`);
  console.log(`❌ Failed: ${failedChunks}`);
  
  if (successfulChunks > 0) {
    console.log('\n🎉 Embedding complete!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Run: pnpm tsx scripts/analyze-rag-coverage.ts');
    console.log('  2. Run: pnpm tsx scripts/benchmark-subject-filtering.ts');
    console.log('  3. Check for improved metrics!\n');
  }
}

embedMissingLessons()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
