/**
 * Test search with very low threshold
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { searchLessonChunks } from '../lib/rag/search-lesson-chunks';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
  console.log('Testing with different thresholds...\n');

  const tests = [
    { query: "loops", threshold: 0.1 },
    { query: "variables", threshold: 0.1 },
    { query: "math", threshold: 0.1 },
    { query: "story", threshold: 0.1 },
  ];

  for (const test of tests) {
    const results = await searchLessonChunks({
      query: test.query,
      matchThreshold: test.threshold,
      matchCount: 3,
    });

    console.log(`Query: "${test.query}" (threshold: ${test.threshold})`);
    console.log(`Results: ${results.length}`);
    if (results.length > 0) {
      results.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.sectionTitle || 'Untitled'} (${(r.similarity * 100).toFixed(1)}%)`);
      });
    }
    console.log();
  }
}

test().catch(console.error);
