import {
  createLink,
  verifyLink,
} from '../../../implementations/ts/sdlp-sdk/dist/src/index';
import { generateTestPayloads } from './test-payloads.js';
import { generateTestKey } from './test-utils.js';
import type {
  BenchmarkResult,
  PayloadSizeTest,
  CapacityTest,
  BenchmarkSuite,
} from './types.js';
import type { Signer } from '../../../implementations/ts/sdlp-sdk/dist/src/types';

export class BenchmarkRunner {
  private readonly testSigner: Signer;
  private readonly results: BenchmarkResult[] = [];
  private readonly capacityTests: CapacityTest[] = [];

  constructor() {
    this.testSigner = generateTestKey();
  }

  async runAllBenchmarks(): Promise<BenchmarkSuite> {
    console.log('🚀 Starting SDLP Benchmark Suite...\n');

    const startTime = Date.now();

    // Run different benchmark categories
    await this.benchmarkLinkCreation();
    await this.benchmarkLinkVerification();
    await this.benchmarkCompression();
    await this.benchmarkCapacityUtilization();

    const totalTime = Date.now() - startTime;

    return this.compileSuite(totalTime);
  }

  private async benchmarkLinkCreation(): Promise<void> {
    console.log('📝 Benchmarking Link Creation...');

    const payloads = generateTestPayloads();

    for (const payload of payloads) {
      // Test without compression
      await this.runCreationBenchmark(
        `Create ${payload.description} (no compression)`,
        payload,
        false
      );

      // Test with compression (for payloads > 256 bytes)
      if (payload.size > 256) {
        await this.runCreationBenchmark(
          `Create ${payload.description} (with compression)`,
          payload,
          true
        );
      }
    }
  }

  private async benchmarkLinkVerification(): Promise<void> {
    console.log('🔍 Benchmarking Link Verification...');

    const payloads = generateTestPayloads();

    for (const payload of payloads) {
      // Create links to verify
      const linkNoCompression = await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress: false,
      });

      const linkWithCompression =
        payload.size > 256
          ? await createLink({
              payload: payload.data,
              payloadType: 'application/json',
              signer: this.testSigner,
              compress: true,
            })
          : null;

      // Benchmark verification
      await this.runVerificationBenchmark(
        `Verify ${payload.description} (no compression)`,
        linkNoCompression
      );

      if (linkWithCompression) {
        await this.runVerificationBenchmark(
          `Verify ${payload.description} (with compression)`,
          linkWithCompression
        );
      }
    }
  }

  private async benchmarkCompression(): Promise<void> {
    console.log('🗜️  Benchmarking Compression Efficiency...');

    const payloads = generateTestPayloads().filter(p => p.size > 256);

    for (const payload of payloads) {
      const linkNoCompression = await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress: false,
      });

      const linkWithCompression = await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress: true,
      });

      const originalSize =
        typeof payload.data === 'string'
          ? new TextEncoder().encode(payload.data).length
          : payload.data.length;
      const uncompressedUrlSize = linkNoCompression.length;
      const compressedUrlSize = linkWithCompression.length;

      const compressionRatio = compressedUrlSize / uncompressedUrlSize;
      const payloadEfficiency = originalSize / compressedUrlSize;

      this.results.push({
        name: `Compression ${payload.description}`,
        category: 'compression',
        iterations: 1,
        totalTime: 0,
        averageTime: 0,
        operationsPerSecond: 0,
        metadata: {
          originalSize,
          uncompressedUrlSize,
          compressedUrlSize,
          compressionRatio,
          payloadEfficiency,
          expectedRatio: payload.expectedCompressionRatio,
        },
      });
    }
  }

  private async benchmarkCapacityUtilization(): Promise<void> {
    console.log('📊 Benchmarking Capacity Utilization...');

    const payloads = generateTestPayloads();

    for (const payload of payloads) {
      const linkUncompressed = await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress: false,
      });

      const linkCompressed =
        payload.size > 256
          ? await createLink({
              payload: payload.data,
              payloadType: 'application/json',
              signer: this.testSigner,
              compress: true,
            })
          : null;

      const payloadBytes =
        typeof payload.data === 'string'
          ? new TextEncoder().encode(payload.data).length
          : payload.data.length;

      // Uncompressed capacity test
      this.capacityTests.push({
        payloadSize: payloadBytes,
        urlLength: linkUncompressed.length,
        efficiency: payloadBytes / linkUncompressed.length,
        compressionRatio: 1.0,
      });

      // Compressed capacity test
      if (linkCompressed) {
        this.capacityTests.push({
          payloadSize: payloadBytes,
          urlLength: linkCompressed.length,
          efficiency: payloadBytes / linkCompressed.length,
          compressionRatio: linkCompressed.length / linkUncompressed.length,
        });
      }
    }
  }

  private async runCreationBenchmark(
    name: string,
    payload: PayloadSizeTest,
    compress: boolean
  ): Promise<void> {
    const iterations = this.getIterationsForSize(payload.size);
    const times: number[] = [];

    // Warm-up
    for (let index = 0; index < Math.min(5, iterations); index++) {
      await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress,
      });
    }

    // Actual benchmark
    for (let index = 0; index < iterations; index++) {
      const start = performance.now();

      await createLink({
        payload: payload.data,
        payloadType: 'application/json',
        signer: this.testSigner,
        compress,
      });

      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;

    this.results.push({
      name,
      category: 'creation',
      iterations,
      totalTime,
      averageTime,
      operationsPerSecond: 1000 / averageTime,
      metadata: {
        payloadSize: payload.size,
        compress,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        medianTime: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      },
    });
  }

  private async runVerificationBenchmark(
    name: string,
    link: string
  ): Promise<void> {
    const iterations = 100; // Fixed iterations for verification
    const times: number[] = [];

    // Warm-up
    for (let index = 0; index < 5; index++) {
      await verifyLink(link);
    }

    // Actual benchmark
    for (let index = 0; index < iterations; index++) {
      const start = performance.now();

      const result = await verifyLink(link);
      if (!result.valid) {
        throw new Error(`Verification failed: ${result.error.message}`);
      }

      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;

    this.results.push({
      name,
      category: 'verification',
      iterations,
      totalTime,
      averageTime,
      operationsPerSecond: 1000 / averageTime,
      metadata: {
        linkLength: link.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        medianTime: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      },
    });
  }

  private getIterationsForSize(size: number): number {
    if (size < 1024) {
      return 1000;
    }
    if (size < 5120) {
      return 500;
    }
    if (size < 10240) {
      return 200;
    }
    return 100;
  }

  private compileSuite(totalTime: number): BenchmarkSuite {
    const creationResults = this.results.filter(r => r.category === 'creation');
    const verificationResults = this.results.filter(
      r => r.category === 'verification'
    );

    const averageCreationTime =
      creationResults.length > 0
        ? creationResults.reduce((sum, r) => sum + r.averageTime, 0) /
          creationResults.length
        : 0;

    const averageVerificationTime =
      verificationResults.length > 0
        ? verificationResults.reduce((sum, r) => sum + r.averageTime, 0) /
          verificationResults.length
        : 0;

    return {
      name: 'SDLP Performance Benchmark Suite',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        sdlpVersion: '1.2.0', // From package.json
      },
      results: this.results,
      capacityAnalysis: this.capacityTests,
      summary: {
        totalTests: this.results.length,
        totalTime,
        averageCreationTime,
        averageVerificationTime,
      },
    };
  }
}
