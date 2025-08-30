export interface BenchmarkResult {
  name: string;
  category: 'creation' | 'verification' | 'compression' | 'capacity';
  iterations: number;
  totalTime: number;
  averageTime: number;
  operationsPerSecond: number;
  metadata?: Record<string, unknown>;
}

export interface PayloadSizeTest {
  size: number;
  description: string;
  data: string | Uint8Array;
  expectedCompressionRatio?: number;
}

export interface CapacityTest {
  payloadSize: number;
  urlLength: number;
  efficiency: number; // payload bytes / total URL bytes
  compressionRatio: number;
}

export interface BenchmarkSuite {
  name: string;
  version: string;
  timestamp: string;
  environment: {
    node: string;
    platform: string;
    arch: string;
    sdlpVersion: string;
  };
  results: BenchmarkResult[];
  capacityAnalysis: CapacityTest[];
  summary: {
    totalTests: number;
    totalTime: number;
    averageCreationTime: number;
    averageVerificationTime: number;
  };
}

export type OutputFormat = 'table' | 'json' | 'csv';
