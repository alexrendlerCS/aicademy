import fs from 'fs';

const data = JSON.parse(fs.readFileSync('RAG_SUBJECT_FILTERING_BENCHMARK.json', 'utf-8'));

console.log('\n📊 REDUCTION ANALYSIS\n');
console.log('═'.repeat(60));

const byCategory: Record<string, any[]> = {};
data.results.forEach((r: any) => {
  if (!byCategory[r.category]) byCategory[r.category] = [];
  byCategory[r.category].push(r);
});

let totalValidQueries = 0;
let totalSavings = 0;
let totalFullTokens = 0;

Object.entries(byCategory).forEach(([cat, results]) => {
  const validResults = results.filter(r => r.fullTokens > 0 && r.with.tokens > 0);
  
  if (validResults.length === 0) {
    console.log(`\n${cat}: ⚠️  No valid data (lessons have no content)`);
    return;
  }
  
  const avgReduction = validResults.reduce((sum, r) => sum + r.reduction, 0) / validResults.length;
  const maxReduction = Math.max(...validResults.map(r => r.reduction));
  const minReduction = Math.min(...validResults.map(r => r.reduction));
  const avgFullTokens = validResults.reduce((sum, r) => sum + r.fullTokens, 0) / validResults.length;
  const avgChunkTokens = validResults.reduce((sum, r) => sum + r.with.tokens, 0) / validResults.length;
  const savings = avgFullTokens - avgChunkTokens;
  
  totalValidQueries += validResults.length;
  totalSavings += savings * validResults.length;
  totalFullTokens += avgFullTokens * validResults.length;
  
  console.log(`\n${cat} (${validResults.length} queries):`);
  console.log(`  Average Reduction: ${avgReduction.toFixed(1)}%`);
  console.log(`  Range: ${minReduction.toFixed(1)}% to ${maxReduction.toFixed(1)}%`);
  console.log(`  Full Content: ${avgFullTokens.toFixed(0)} tokens avg`);
  console.log(`  Retrieved: ${avgChunkTokens.toFixed(0)} tokens avg`);
  console.log(`  Savings: ${savings.toFixed(0)} tokens/query`);
  
  // Show individual results if interesting
  if (avgReduction < 0) {
    console.log(`  ⚠️  Negative reduction - retrieving MORE than full content`);
    console.log(`      This happens when chunks are selected from multiple sections`);
  } else if (avgReduction > 50) {
    console.log(`  ✅ Great reduction - selective retrieval working well`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('\n📈 OVERALL SUMMARY\n');
console.log(`Total Valid Queries: ${totalValidQueries}`);
console.log(`Average Savings: ${(totalSavings / totalValidQueries).toFixed(0)} tokens/query`);
console.log(`Average Full Content: ${(totalFullTokens / totalValidQueries).toFixed(0)} tokens`);

const avgReductionPercent = (totalSavings / totalFullTokens) * 100;
console.log(`Overall Reduction: ${avgReductionPercent.toFixed(1)}%`);

console.log('\n💡 INSIGHTS:\n');

if (avgReductionPercent > 30) {
  console.log('✅ Excellent reduction (>30%) - RAG is significantly reducing context size');
} else if (avgReductionPercent > 10) {
  console.log('✅ Good reduction (10-30%) - RAG is providing meaningful token savings');
} else if (avgReductionPercent > 0) {
  console.log('⚠️  Low reduction (<10%) - Consider if full content is already concise');
} else {
  console.log('⚠️  Negative reduction - RAG retrieving more than needed');
  console.log('   This can happen when:');
  console.log('   • Multiple relevant sections exist');
  console.log('   • Lessons are already very concise');
  console.log('   • Query matches multiple chunks');
}

console.log('\n📊 At scale (1000 queries/day):');
const dailySavings = (totalSavings / totalValidQueries) * 1000;
console.log(`  Daily token savings: ~${dailySavings.toFixed(0)} tokens`);
console.log(`  Monthly savings: ~${(dailySavings * 30 / 1000).toFixed(1)}K tokens`);
console.log(`  Cost savings (at $0.50/1M tokens): ~$${(dailySavings * 30 * 0.5 / 1000000).toFixed(2)}/month`);

console.log('\n');
