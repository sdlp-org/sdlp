// Using simple table formatting instead of 'table' package
// import { table } from 'table';
import { formatDuration, formatBytes, formatRate } from './test-utils.js';
import type { BenchmarkSuite, BenchmarkResult, OutputFormat } from './types.js';

export function formatOutput(
  suite: BenchmarkSuite,
  format: OutputFormat
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(suite, null, 2);
    case 'csv':
      return formatAsCSV(suite);
    case 'table':
    default:
      return formatAsTable(suite);
  }
}

function formatAsTable(suite: BenchmarkSuite): string {
  let output = '';

  // Header
  output += '🔬 SDLP Performance Benchmark Results\n';
  output += '=====================================\n\n';

  // Environment info
  output += '📋 Environment:\n';
  output += `   Node.js: ${suite.environment.node}\n`;
  output += `   Platform: ${suite.environment.platform}/${suite.environment.arch}\n`;
  output += `   SDLP Version: ${suite.environment.sdlpVersion}\n`;
  output += `   Timestamp: ${new Date(suite.timestamp).toLocaleString()}\n\n`;

  // Summary
  output += '📊 Summary:\n';
  output += `   Total Tests: ${suite.summary.totalTests}\n`;
  output += `   Total Time: ${formatDuration(suite.summary.totalTime)}\n`;
  output += `   Avg Creation Time: ${formatDuration(suite.summary.averageCreationTime)}\n`;
  output += `   Avg Verification Time: ${formatDuration(suite.summary.averageVerificationTime)}\n\n`;

  // Performance Results by Category
  const categories = ['creation', 'verification', 'compression'] as const;

  for (const category of categories) {
    const results = suite.results.filter(r => r.category === category);
    if (results.length === 0) {
      continue;
    }

    output += `\n📈 ${category.toUpperCase()} PERFORMANCE\n`;
    output += `${''.padEnd(40, '=')}\n`;

    const tableData = [
      ['Test Name', 'Avg Time', 'Ops/Sec', 'Iterations', 'Notes'],
    ];

    for (const result of results) {
      const notes = formatTestNotes(result);
      tableData.push([
        result.name.length > 35
          ? `${result.name.slice(0, 32)}...`
          : result.name,
        formatDuration(result.averageTime),
        formatRate(result.operationsPerSecond),
        result.iterations.toString(),
        notes,
      ]);
    }

    output += formatSimpleTable(tableData);
  }

  // Capacity Analysis
  if (suite.capacityAnalysis.length > 0) {
    output += '\n📏 CAPACITY UTILIZATION ANALYSIS\n';
    output += `${''.padEnd(40, '=')}\n`;

    const capacityData = [
      ['Payload Size', 'URL Length', 'Efficiency', 'Compression'],
    ];

    const uniqueCapacityTests = suite.capacityAnalysis
      .filter(
        (test, index, arr) =>
          arr.findIndex(
            t =>
              t.payloadSize === test.payloadSize &&
              t.compressionRatio === test.compressionRatio
          ) === index
      )
      .sort((a, b) => a.payloadSize - b.payloadSize);

    for (const test of uniqueCapacityTests) {
      capacityData.push([
        formatBytes(test.payloadSize),
        formatBytes(test.urlLength),
        `${(test.efficiency * 100).toFixed(1)}%`,
        test.compressionRatio < 1
          ? `${(test.compressionRatio * 100).toFixed(0)}%`
          : 'None',
      ]);
    }

    output += formatSimpleTable(capacityData);
  }

  // Key Insights
  output += '\n🎯 KEY INSIGHTS\n';
  output += `${''.padEnd(40, '=')}\n`;

  const creationResults = suite.results.filter(r => r.category === 'creation');
  const verificationResults = suite.results.filter(
    r => r.category === 'verification'
  );
  const compressionResults = suite.results.filter(
    r => r.category === 'compression'
  );

  if (creationResults.length > 0) {
    const fastest = creationResults.reduce((previous, current) =>
      previous.averageTime < current.averageTime ? previous : current
    );
    const slowest = creationResults.reduce((previous, current) =>
      previous.averageTime > current.averageTime ? previous : current
    );

    output += `• Fastest Link Creation: ${formatDuration(fastest.averageTime)} (${fastest.name})\n`;
    output += `• Slowest Link Creation: ${formatDuration(slowest.averageTime)} (${slowest.name})\n`;
  }

  if (verificationResults.length > 0) {
    const avgVerification =
      verificationResults.reduce((sum, r) => sum + r.averageTime, 0) /
      verificationResults.length;
    output += `• Average Verification Time: ${formatDuration(avgVerification)}\n`;
  }

  if (compressionResults.length > 0) {
    const bestCompression = compressionResults.reduce((previous, current) => {
      const previousRatio = previous.metadata?.compressionRatio ?? 1;
      const currentRatio = current.metadata?.compressionRatio ?? 1;
      return previousRatio < currentRatio ? previous : current;
    });

    const compressionRatio = bestCompression.metadata?.compressionRatio;
    if (typeof compressionRatio === 'number') {
      output += `• Best Compression: ${((1 - compressionRatio) * 100).toFixed(0)}% reduction\n`;
    }
  }

  // URL Length Analysis
  if (suite.capacityAnalysis.length > 0) {
    const maxUrlLength = Math.max(
      ...suite.capacityAnalysis.map(t => t.urlLength)
    );
    const minUrlLength = Math.min(
      ...suite.capacityAnalysis.map(t => t.urlLength)
    );
    output += `• URL Length Range: ${formatBytes(minUrlLength)} - ${formatBytes(maxUrlLength)}\n`;

    // Efficiency Analysis
    const avgEfficiency =
      suite.capacityAnalysis.reduce((sum, t) => sum + t.efficiency, 0) /
      suite.capacityAnalysis.length;
    output += `• Average Payload Efficiency: ${(avgEfficiency * 100).toFixed(1)}%\n`;
  }

  return output;
}

function formatAsCSV(suite: BenchmarkSuite): string {
  const lines = [
    'Category,Test Name,Average Time (ms),Operations/Sec,Iterations,Payload Size,Compression,URL Length',
  ];

  for (const result of suite.results) {
    const payloadSize = result.metadata?.payloadSize ?? '';
    const compression = result.metadata?.compress ? 'Yes' : 'No';
    const urlLength = result.metadata?.linkLength ?? '';

    lines.push(
      [
        result.category,
        `"${result.name}"`,
        result.averageTime.toFixed(3),
        result.operationsPerSecond.toFixed(2),
        result.iterations,
        payloadSize,
        compression,
        urlLength,
      ].join(',')
    );
  }

  return lines.join('\n');
}

function formatTestNotes(result: BenchmarkResult): string {
  const notes = [];

  if (
    result.metadata?.payloadSize &&
    typeof result.metadata.payloadSize === 'number'
  ) {
    notes.push(formatBytes(result.metadata.payloadSize));
  }

  if (result.metadata?.compress) {
    notes.push('Compressed');
  }

  if (
    result.metadata?.compressionRatio &&
    typeof result.metadata.compressionRatio === 'number' &&
    result.metadata.compressionRatio < 1
  ) {
    notes.push(
      `${Math.round((1 - result.metadata.compressionRatio) * 100)}% smaller`
    );
  }

  return notes.join(', ');
}

function formatSimpleTable(data: string[][]): string {
  if (data.length === 0) {
    return '';
  }

  const firstRow = data[0];
  if (!firstRow) {
    return '';
  }

  // Calculate column widths
  const colWidths = firstRow.map((_, colIndex) =>
    // eslint-disable-next-line security/detect-object-injection
    Math.max(...data.map(row => (row[colIndex] ?? '').toString().length))
  );

  let output = '';

  data.forEach((row, rowIndex) => {
    const formattedRow = row
      .map((cell, colIndex) =>
        // eslint-disable-next-line security/detect-object-injection
        (cell ?? '').toString().padEnd(colWidths[colIndex] ?? 0)
      )
      .join(' | ');

    output += `${formattedRow}\n`;

    // Add separator after header row
    if (rowIndex === 0) {
      output += `${colWidths.map(width => '-'.repeat(width)).join('-+-')}\n`;
    }
  });

  return `${output}\n`;
}
