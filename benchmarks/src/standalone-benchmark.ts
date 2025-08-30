#!/usr/bin/env node

/**
 * Standalone SDLP Benchmark - no external dependencies on SDK
 * This file contains the exact same logic as the minimal benchmark but as proper TypeScript
 */

// Import the SDK dynamically to avoid TypeScript module resolution issues
async function runBenchmarks(): Promise<void> {
  try {
    // Dynamic import to avoid TypeScript compilation issues
    const sdlpModule = await import(
      '../../implementations/ts/sdlp-sdk/dist/src/index.js'
    );
    const { createLink, verifyLink } = sdlpModule;

    console.log('🚀 Starting SDLP Performance Benchmarks...');
    console.log();

    const testSigner = {
      kid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      privateKeyJwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: 'XI0CXm4X9R5JtQ_P8TbTF-zlXlTYCQSE_5W2FxT5Aic',
        d: 'PwNrwDyAhz3HLLOq0HY6O3d0HpP9e8JHQJ9V7WhLMZA',
        use: 'sig',
        alg: 'EdDSA',
      },
    };

    // Test payloads
    const payloads = [
      {
        name: '32B command',
        data: JSON.stringify({ cmd: 'status', id: 123 }),
        size: 32,
      },
      {
        name: '256B config',
        data: JSON.stringify({
          config: {
            api_endpoint: 'https://api.example.com/v1',
            timeout: 30000,
            retry_attempts: 3,
            features: ['auth', 'compression', 'encryption'],
            settings: { debug: false, cache: true },
          },
        }),
        size: 256,
      },
      {
        name: '1KB prompt',
        data: JSON.stringify({
          type: 'ai_prompt',
          content:
            'You are a helpful AI assistant. Please analyze the following data and provide insights about performance optimization strategies for web applications, focusing on frontend rendering, API efficiency, and caching mechanisms.',
          context: {
            domain: 'web_performance',
            user_level: 'intermediate',
            output_format: 'detailed_analysis',
          },
        }),
        size: 1024,
      },
    ];

    interface BenchmarkResult {
      name: string;
      avgTime: number;
      opsPerSec: number;
      iterations: number;
    }

    const results: BenchmarkResult[] = [];
    const capacityResults: Array<{
      payloadSize: number;
      urlLength: number;
      efficiency: number;
    }> = [];

    console.log('📝 Benchmarking Link Creation...');

    for (const payload of payloads) {
      // Benchmark creation without compression
      const iterations = payload.size < 500 ? 100 : 50;
      const times: number[] = [];

      // Warmup
      for (let index = 0; index < 5; index++) {
        await createLink({
          payload: new TextEncoder().encode(payload.data),
          payloadType: 'application/json',
          signer: testSigner,
          compress: 'none',
        });
      }

      // Actual benchmark
      for (let index = 0; index < iterations; index++) {
        const start = performance.now();
        await createLink({
          payload: new TextEncoder().encode(payload.data),
          payloadType: 'application/json',
          signer: testSigner,
          compress: 'none',
        });
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / iterations;
      results.push({
        name: `Create ${payload.name}`,
        avgTime,
        opsPerSec: 1000 / avgTime,
        iterations,
      });

      // Test with compression for larger payloads
      if (payload.size > 200) {
        const compressedTimes: number[] = [];

        for (let index = 0; index < iterations; index++) {
          const start = performance.now();
          await createLink({
            payload: new TextEncoder().encode(payload.data),
            payloadType: 'application/json',
            signer: testSigner,
            compress: 'br',
          });
          const end = performance.now();
          compressedTimes.push(end - start);
        }

        const compressedAvg =
          compressedTimes.reduce((sum, t) => sum + t, 0) / iterations;
        results.push({
          name: `Create ${payload.name} (compressed)`,
          avgTime: compressedAvg,
          opsPerSec: 1000 / compressedAvg,
          iterations,
        });
      }
    }

    console.log('🔍 Benchmarking Link Verification...');

    for (const payload of payloads) {
      // Create a link to verify
      const link = await createLink({
        payload: new TextEncoder().encode(payload.data),
        payloadType: 'application/json',
        signer: testSigner,
        compress: 'none',
      });

      const times: number[] = [];
      const iterations = 50;

      // Warmup
      for (let index = 0; index < 5; index++) {
        await verifyLink(link);
      }

      // Actual benchmark
      for (let index = 0; index < iterations; index++) {
        const start = performance.now();
        await verifyLink(link);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / iterations;
      results.push({
        name: `Verify ${payload.name}`,
        avgTime,
        opsPerSec: 1000 / avgTime,
        iterations,
      });
    }

    console.log('📊 Analyzing Capacity Utilization...');

    for (const payload of payloads) {
      const uncompressedLink = await createLink({
        payload: new TextEncoder().encode(payload.data),
        payloadType: 'application/json',
        signer: testSigner,
        compress: 'none',
      });

      const payloadBytes = new TextEncoder().encode(payload.data).length;
      capacityResults.push({
        payloadSize: payloadBytes,
        urlLength: uncompressedLink.length,
        efficiency: (payloadBytes / uncompressedLink.length) * 100,
      });

      if (payload.size > 200) {
        const compressedLink = await createLink({
          payload: new TextEncoder().encode(payload.data),
          payloadType: 'application/json',
          signer: testSigner,
          compress: 'br',
        });

        capacityResults.push({
          payloadSize: payloadBytes,
          urlLength: compressedLink.length,
          efficiency: (payloadBytes / compressedLink.length) * 100,
        });
      }
    }

    console.log();
    console.log('✅ Benchmarks completed successfully!');
    console.log();

    // Output results
    console.log('🔬 SDLP Performance Benchmark Results');
    console.log('===================================');
    console.log(
      `Node.js: ${process.version} | Platform: ${process.platform}/${process.arch}`
    );
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log();

    console.log('📈 PERFORMANCE RESULTS');
    console.log('----------------------');
    console.log(
      'Test Name                          Avg Time    Ops/Sec     Iterations'
    );
    console.log(
      '----------------------------------------------------------------------'
    );

    for (const result of results) {
      const name = result.name.padEnd(34);
      const time = `${result.avgTime.toFixed(2)}ms`.padEnd(11);
      const ops = Math.round(result.opsPerSec).toString().padEnd(11);
      const iterations = result.iterations.toString();
      console.log(`${name} ${time} ${ops} ${iterations}`);
    }

    console.log();
    console.log('📏 CAPACITY UTILIZATION');
    console.log('-----------------------');
    console.log('Payload   Raw URL     Compressed  Efficiency  Saved');
    console.log('------------------------------------------------------------');

    for (const result of capacityResults) {
      const size = `${result.payloadSize}B`.padEnd(9);
      const url = `${result.urlLength}B`.padEnd(11);
      const efficiency = `${result.efficiency.toFixed(1)}%`.padEnd(11);
      console.log(`${size} ${url} ${url}        ${efficiency} 0%`);
    }

    console.log();
    console.log('🎯 KEY INSIGHTS');
    console.log('===============');

    const creationResults = results.filter(r => r.name.includes('Create'));
    const verificationResults = results.filter(r => r.name.includes('Verify'));

    if (creationResults.length > 0) {
      const avgCreation =
        creationResults.reduce((sum, r) => sum + r.avgTime, 0) /
        creationResults.length;
      console.log(`• Average Link Creation Time: ${avgCreation.toFixed(2)}ms`);
    }

    if (verificationResults.length > 0) {
      const avgVerification =
        verificationResults.reduce((sum, r) => sum + r.avgTime, 0) /
        verificationResults.length;
      console.log(
        `• Average Verification Time: ${avgVerification.toFixed(2)}ms`
      );
    }

    console.log(`• Total Tests Completed: ${results.length}`);

    const fastest = results.reduce((previous, current) =>
      previous.avgTime < current.avgTime ? previous : current
    );
    console.log(
      `• Fastest Creation: ${fastest.avgTime.toFixed(2)}ms (${fastest.name})`
    );

    if (capacityResults.length > 0) {
      const bestEfficiency = Math.max(
        ...capacityResults.map(r => r.efficiency)
      );
      console.log(
        `• Best Compression: ${bestEfficiency.toFixed(1)}% payload efficiency`
      );
    }
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks();
}
