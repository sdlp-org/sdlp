# SDLP Benchmarks

Performance benchmarks for the Secure Deep Link Protocol (SDLP) implementation.

## Overview

This benchmark suite measures the performance of SDLP link creation, verification, and capacity utilization across different payload sizes and compression options.

## Quick Start

### Running Benchmarks

```bash
# Run the standalone benchmark (recommended)
npm run benchmark

# Run with different output formats
npm run benchmark:json    # JSON output
npm run benchmark:csv     # CSV output
npm run benchmark:simple  # Simple table output
```

### From the root directory

```bash
# Using Justfile (from project root)
just benchmark

# Direct execution
cd benchmarks && npm run benchmark
```

## Benchmark Types

### 1. Link Creation Performance

- Tests link creation speed with different payload sizes
- Measures both compressed and uncompressed scenarios
- Reports operations per second and average time

### 2. Link Verification Performance

- Tests verification speed for created links
- Measures cryptographic signature validation performance

### 3. Capacity Utilization Analysis

- Analyzes URL length efficiency
- Compares compression ratios
- Reports payload-to-URL size efficiency

## Test Payloads

The benchmarks use three standard test payloads:

- **32B command**: Small JSON command (25 bytes actual)
- **256B config**: Medium configuration object (178 bytes actual)
- **1KB prompt**: Large AI prompt data (358 bytes actual)

## Output

The benchmark produces:

- **Performance Results**: Timing and throughput metrics
- **Capacity Analysis**: URL efficiency and compression ratios
- **Key Insights**: Summary of fastest operations and best compression

Example output:

```
📈 PERFORMANCE RESULTS
----------------------
Test Name                          Avg Time    Ops/Sec     Iterations
----------------------------------------------------------------------
Create 32B command                 0.10ms      10000       100
Create 256B config                 0.09ms      11000       100
Create 1KB prompt                  0.09ms      11500       50
Verify 32B command                 0.38ms      2600        50
```

## Development

### Code Quality

```bash
# Run linting
npm run lint

# Run formatting
npm run format

# Type checking
npm run typecheck
```

### Building

```bash
# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Implementation Details

- Uses `tsx` for TypeScript execution
- Dynamic imports to avoid module resolution issues
- Warmup iterations for accurate measurements
- Comprehensive error handling and validation

## Integration

The benchmarks are integrated into the project's development workflow:

- Linting: `just lint` includes benchmark code
- Formatting: `just format` includes benchmark code
- Continuous quality checks with ESLint and Prettier
