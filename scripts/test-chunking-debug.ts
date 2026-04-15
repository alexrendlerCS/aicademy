import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { chunkLessonContent } from '../lib/rag/chunk-lessons';

const testContent = `<h1>Understanding the Atmosphere</h1><p>The <strong>atmosphere</strong> is a dynamic system of gases that surrounds Earth, protecting life and helping regulate temperature. It plays a vital role in weather, climate, and sustaining life.</p><h2>Atmospheric Layers</h2><h3>1. Troposphere (0–10 km)</h3><ul><li><p>Where all weather events occur</p></li><li><p>Temperature decreases with height</p></li><li><p>Contains ~75% of atmospheric mass</p></li></ul>`;

console.log('Testing chunking...\n');
console.log('Content length:', testContent.length);
console.log('Content:', testContent.substring(0, 200) + '...');

const chunks = chunkLessonContent(testContent, {
  minChunkSize: 10, // Lower threshold
  maxChunkSize: 300,
  preserveHeadings: true,
  includeMetadata: true,
});

console.log('\nChunks generated:', chunks.length);
chunks.forEach((chunk, i) => {
  console.log(`\nChunk ${i}:`);
  console.log('  Text:', chunk.chunkText.substring(0, 100) + '...');
  console.log('  Words:', chunk.chunkText.split(/\s+/).length);
  console.log('  Section:', chunk.sectionTitle);
  console.log('  Metadata:', chunk.metadata);
});
