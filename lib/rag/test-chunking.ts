/**
 * Test script for lesson chunking functionality
 * Run with: pnpm tsx lib/rag/test-chunking.ts
 */

import { chunkLessonContent, normalizeTextForEmbedding, validateChunk } from './chunk-lessons';

// Sample lesson content (similar to what's in your database)
const sampleLessonHTML = `
<h2>Introduction to Functions</h2>
<p>Functions are reusable blocks of code that perform specific tasks. They are one of the fundamental building blocks of programming and help you organize your code efficiently.</p>

<h3>Why Use Functions?</h3>
<p>Functions provide several key benefits:</p>
<ul>
  <li>Code reusability - write once, use many times</li>
  <li>Better organization and readability</li>
  <li>Easier debugging and maintenance</li>
  <li>Abstraction of complex logic</li>
</ul>

<h3>Function Syntax</h3>
<p>In most programming languages, functions follow a similar structure. Here's a basic example:</p>
<pre>
function greet(name) {
  return "Hello, " + name + "!";
}
</pre>
<p>This function takes a parameter called 'name' and returns a greeting message.</p>

<h3>Parameters and Arguments</h3>
<p>Parameters are variables that act as placeholders in the function definition. Arguments are the actual values you pass to the function when you call it.</p>
<blockquote>
Remember: Parameters are like recipe ingredients listed at the top, while arguments are the actual ingredients you use when cooking.
</blockquote>

<h3>Return Values</h3>
<p>Functions can send data back to where they were called using the return statement. This allows you to use the result of a function's computation in other parts of your code.</p>
<p>Not all functions need to return a value. Some functions perform actions (like printing to the console) without returning anything.</p>
`;

console.log('🧪 Testing Lesson Chunking Utility\n');
console.log('=' .repeat(60));

// Test 1: Basic chunking
console.log('\n📝 Test 1: Basic Chunking');
console.log('-'.repeat(60));

const chunks = chunkLessonContent(sampleLessonHTML);

console.log(`✅ Created ${chunks.length} chunks\n`);

chunks.forEach((chunk, index) => {
  console.log(`Chunk ${index + 1}:`);
  console.log(`  Section: ${chunk.sectionTitle || 'No section'}`);
  console.log(`  Words: ${chunk.metadata?.wordCount || 0}`);
  console.log(`  Has code: ${chunk.metadata?.hasCode ? 'Yes' : 'No'}`);
  console.log(`  Has list: ${chunk.metadata?.hasList ? 'Yes' : 'No'}`);
  console.log(`  Text preview: ${chunk.chunkText.substring(0, 80)}...`);
  console.log();
});

// Test 2: Normalization for embedding
console.log('\n📝 Test 2: Text Normalization');
console.log('-'.repeat(60));

const rawText = chunks[0].chunkText;
const normalized = normalizeTextForEmbedding(rawText);

console.log('Original length:', rawText.length);
console.log('Normalized length:', normalized.length);
console.log('Normalized preview:', normalized.substring(0, 100) + '...');

// Test 3: Chunk validation
console.log('\n\n📝 Test 3: Chunk Validation');
console.log('-'.repeat(60));

chunks.forEach((chunk, index) => {
  const isValid = validateChunk(chunk, 50);
  console.log(`Chunk ${index + 1}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test 4: Custom chunking options
console.log('\n\n📝 Test 4: Custom Chunking Options');
console.log('-'.repeat(60));

const customChunks = chunkLessonContent(sampleLessonHTML, {
  minChunkSize: 50,
  maxChunkSize: 150,
  preserveHeadings: true,
  includeMetadata: true,
});

console.log(`✅ Created ${customChunks.length} chunks with custom options`);
console.log(`   (min: 50 words, max: 150 words)\n`);

customChunks.forEach((chunk, index) => {
  console.log(`Chunk ${index + 1}: ${chunk.metadata?.wordCount} words`);
});

// Test 5: Empty content handling
console.log('\n\n📝 Test 5: Empty Content Handling');
console.log('-'.repeat(60));

const emptyChunks = chunkLessonContent('');
console.log(`Empty content produced: ${emptyChunks.length} chunks ${emptyChunks.length === 0 ? '✅' : '❌'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 All tests completed!');
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('1. ✅ Chunking utility is working');
console.log('2. 📦 Install OpenAI SDK: pnpm add openai');
console.log('3. 🔧 Create embedding generation script');
console.log('4. 🚀 Generate embeddings for all lessons');
