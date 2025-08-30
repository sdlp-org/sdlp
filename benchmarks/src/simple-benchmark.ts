#!/usr/bin/env node

import { BenchmarkRunner } from './benchmark-runner.js';
import { formatOutput } from './formatters.js';

async function main(): Promise<void> {
  try {
    console.error('🚀 Starting SDLP Performance Benchmarks...\n');

    const runner = new BenchmarkRunner();
    const suite = await runner.runAllBenchmarks();

    console.error('\n✅ Benchmarks completed successfully!\n');

    const output = formatOutput(suite, 'table');
    console.log(output);

    console.error(`\n📊 Quick Summary:`);
    console.error(`   Total Tests: ${suite.summary.totalTests}`);
    console.error(
      `   Avg Creation: ${suite.summary.averageCreationTime.toFixed(2)}ms`
    );
    console.error(
      `   Avg Verification: ${suite.summary.averageVerificationTime.toFixed(2)}ms`
    );
  } catch (error) {
    console.error('❌ Benchmark failed:');
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
