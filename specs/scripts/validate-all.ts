#!/usr/bin/env node

/**
 * SDLP Complete Validation Suite
 *
 * Runs all validation checks in the correct order to ensure spec consistency.
 * This prevents the inconsistencies that occurred during implementation.
 *
 * Usage:
 *   tsx validate-all.ts
 *   npm run validate-all
 */

import { validateTestFixtures } from './validate-fixtures.js';
import { validateTestVectors } from './validate-test-vectors.js';

interface ValidationSuite {
  fixtures: boolean;
  vectors: boolean;
  overall: boolean;
  errors: string[];
  warnings: string[];
}

async function runValidationSuite(): Promise<ValidationSuite> {
  const suite: ValidationSuite = {
    fixtures: false,
    vectors: false,
    overall: false,
    errors: [],
    warnings: [],
  };

  console.log('🔍 SDLP Specification Validation Suite');
  console.log('=====================================\n');

  // Step 1: Validate test fixtures
  console.log('1️⃣  Validating test fixtures...');
  const fixturesResult = validateTestFixtures();

  if (fixturesResult.valid) {
    console.log('   ✅ Test fixtures are valid');
    suite.fixtures = true;
  } else {
    console.log('   ❌ Test fixtures validation failed');
    suite.errors.push('Test fixtures validation failed');

    for (const error of fixturesResult.errors) {
      console.log(`      • ${error}`);
      suite.errors.push(`Fixtures: ${error}`);
    }
  }

  if (fixturesResult.warnings.length > 0) {
    console.log('   ⚠️  Fixtures warnings:');
    for (const warning of fixturesResult.warnings) {
      console.log(`      • ${warning}`);
      suite.warnings.push(`Fixtures: ${warning}`);
    }
  }

  console.log('');

  // Step 2: Validate test vectors (only if fixtures are valid)
  console.log('2️⃣  Validating test vectors...');

  if (!suite.fixtures) {
    console.log('   ⏭️  Skipped (fixtures invalid)');
    suite.errors.push('Test vectors skipped due to invalid fixtures');
  } else {
    const vectorsResult = validateTestVectors();

    if (vectorsResult.valid) {
      console.log('   ✅ Test vectors are valid');
      suite.vectors = true;
    } else {
      console.log('   ❌ Test vectors validation failed');
      suite.errors.push('Test vectors validation failed');

      for (const error of vectorsResult.errors) {
        console.log(`      • ${error}`);
        suite.errors.push(`Vectors: ${error}`);
      }
    }

    if (vectorsResult.warnings.length > 0) {
      console.log('   ⚠️  Vectors warnings:');
      for (const warning of vectorsResult.warnings) {
        console.log(`      • ${warning}`);
        suite.warnings.push(`Vectors: ${warning}`);
      }
    }
  }

  console.log('');

  // Overall result
  suite.overall = suite.fixtures && suite.vectors;

  return suite;
}

async function main(): Promise<void> {
  const result = await runValidationSuite();

  console.log('📊 Validation Summary');
  console.log('====================');
  console.log(`Test Fixtures: ${result.fixtures ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test Vectors:  ${result.vectors ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall:       ${result.overall ? '✅ PASS' : '❌ FAIL'}`);

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of result.warnings) {
      console.log(`   • ${warning}`);
    }
  }

  if (result.overall) {
    console.log('\n🎉 All validations passed! Spec is consistent.');
    console.log(
      '\n✨ The SDLP specification, test fixtures, and test vectors are all valid and consistent.'
    );
    console.log('   You can safely use these for implementation testing.');
    process.exit(0);
  } else {
    console.log('\n💥 Validation failed!');
    console.log('\n🚨 Critical Issues:');
    for (const error of result.errors) {
      console.log(`   • ${error}`);
    }

    console.log('\n🔧 Recommended Actions:');
    if (!result.fixtures) {
      console.log(
        '   1. Fix test fixtures first using: npm run generate-did-key'
      );
      console.log('   2. Verify fixtures with: npm run validate-fixtures');
    }
    if (!result.vectors) {
      console.log('   3. Regenerate test vectors: npm run generate-vectors');
      console.log('   4. Verify vectors with: npm run validate-test-vectors');
    }
    console.log('   5. Run full validation: npm run validate-all');

    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Validation suite crashed:', error);
    process.exit(1);
  });
}

export { runValidationSuite };
