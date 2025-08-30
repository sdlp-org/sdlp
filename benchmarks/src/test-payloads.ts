import type { PayloadSizeTest } from './types.js';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: unknown;
  responses?: unknown;
  [key: string]: unknown;
}

interface DatasetItem {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  tags: string[];
  description: string;
  attributes: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    material: string;
  };
}

interface UIComponent {
  type: string;
  id?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  properties?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
  ttl?: number;
  expiry?: number;
  [key: string]: unknown;
}

interface PendingOperation {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: string;
}

interface ServiceConfig {
  enabled: boolean;
  endpoint: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
  };
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  requestId?: string;
  userId?: string;
  service?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Generate test payloads of various sizes and types
export function generateTestPayloads(): PayloadSizeTest[] {
  const payloads: PayloadSizeTest[] = [
    // Small payloads (< 1KB)
    {
      size: 32,
      description: 'Minimal command (32 bytes)',
      data: JSON.stringify({ cmd: 'status', id: 123 }),
    },
    {
      size: 128,
      description: 'Short message (128 bytes)',
      data: JSON.stringify({
        type: 'message',
        content:
          'Hello, this is a test message for SDLP benchmarking purposes.',
        timestamp: Date.now(),
      }),
    },
    {
      size: 256,
      description: 'Configuration snippet (256 bytes)',
      data: JSON.stringify({
        config: {
          api_endpoint: 'https://api.example.com/v1',
          timeout: 30000,
          retry_attempts: 3,
          features: ['auth', 'compression', 'encryption'],
          metadata: { version: '1.0', build: '12345' },
        },
      }),
    },

    // Medium payloads (1-5KB)
    {
      size: 1024,
      description: 'AI prompt template (1KB)',
      data: JSON.stringify({
        prompt: {
          system:
            'You are a helpful AI assistant specialized in software development.',
          user: 'Please explain the concept of {{topic}} and provide a practical example using {{language}}. Include best practices and common pitfalls to avoid.',
          parameters: {
            topic: 'dependency injection',
            language: 'TypeScript',
            complexity: 'intermediate',
          },
          metadata: {
            version: '2.1',
            category: 'software-development',
            tags: ['tutorial', 'best-practices', 'examples'],
          },
        },
      }),
      expectedCompressionRatio: 0.6,
    },
    {
      size: 2048,
      description: 'API configuration (2KB)',
      data: generateApiConfig(2048),
      expectedCompressionRatio: 0.7,
    },
    {
      size: 5120,
      description: 'Large JSON dataset (5KB)',
      data: generateLargeDataset(5120),
      expectedCompressionRatio: 0.5,
    },

    // Large payloads (5-20KB)
    {
      size: 10240,
      description: 'Complex application state (10KB)',
      data: generateComplexState(10240),
      expectedCompressionRatio: 0.4,
    },
    {
      size: 16384,
      description: 'Large configuration (16KB)',
      data: generateLargeConfig(16384),
      expectedCompressionRatio: 0.45,
    },

    // Binary-like data
    {
      size: 1024,
      description: 'Base64 encoded data (1KB)',
      data: generateBase64Data(1024),
      expectedCompressionRatio: 0.9, // Base64 doesn't compress well
    },

    // Highly compressible data
    {
      size: 2048,
      description: 'Repetitive data (2KB)',
      data: generateRepetitiveData(2048),
      expectedCompressionRatio: 0.1, // Should compress very well
    },
  ];

  return payloads;
}

function generateApiConfig(targetSize: number): string {
  const baseConfig = {
    service: {
      name: 'data-processing-service',
      version: '2.1.0',
      endpoints: [] as ApiEndpoint[],
      authentication: {
        type: 'bearer',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read', 'write', 'admin'],
      },
      rateLimit: {
        requests: 1000,
        window: 3600,
        burstSize: 50,
      },
    },
  };

  // Add endpoints until we reach target size
  let currentData = JSON.stringify(baseConfig);
  let counter = 1;

  while (currentData.length < targetSize) {
    baseConfig.service.endpoints.push({
      path: `/api/v1/resource${counter}`,
      method: 'GET',
      description: `Retrieve resource ${counter} with optional filtering and pagination`,
      parameters: {
        limit: { type: 'integer', default: 50, max: 1000 },
        offset: { type: 'integer', default: 0 },
        filter: { type: 'string', description: 'Optional filter expression' },
      },
      response: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/definitions/Resource${counter}` },
          },
          meta: { $ref: '#/definitions/PaginationMeta' },
        },
      },
    });
    counter++;
    currentData = JSON.stringify(baseConfig);
  }

  return currentData.slice(0, targetSize);
}

function generateLargeDataset(targetSize: number): string {
  const dataset = {
    metadata: {
      version: '1.0',
      generated: new Date().toISOString(),
      source: 'benchmark-generator',
    },
    data: [] as DatasetItem[],
  };

  let currentData = JSON.stringify(dataset);
  let id = 1;

  while (currentData.length < targetSize) {
    dataset.data.push({
      id: id++,
      name: `Item ${id}`,
      category:
        (['electronics', 'books', 'clothing', 'food'] as const)[id % 4] ??
        'electronics',
      price: Math.round(Math.random() * 1000 * 100) / 100,
      inStock: Math.random() > 0.3,
      tags: [`tag${id % 10}`, `category${id % 5}`],
      description: `This is a detailed description for item ${id} which contains various features and specifications.`,
      attributes: {
        weight: Math.round(Math.random() * 100 * 100) / 100,
        dimensions: {
          length: Math.round(Math.random() * 50 * 100) / 100,
          width: Math.round(Math.random() * 50 * 100) / 100,
          height: Math.round(Math.random() * 50 * 100) / 100,
        },
        material:
          (['plastic', 'metal', 'wood', 'fabric'] as const)[id % 4] ??
          'plastic',
      },
    });
    currentData = JSON.stringify(dataset);
  }

  return currentData.slice(0, targetSize);
}

function generateComplexState(targetSize: number): string {
  const state = {
    application: {
      name: 'Complex Application State',
      version: '3.2.1',
      sessionId: crypto.randomUUID(),
    },
    user: {
      id: 'user-12345',
      preferences: {},
      permissions: [] as string[],
    },
    ui: {
      theme: 'dark',
      language: 'en-US',
      components: {} as Record<string, UIComponent>,
    },
    data: {
      cache: {} as Record<string, CacheEntry>,
      pending: [] as PendingOperation[],
    },
  };

  let currentData = JSON.stringify(state);
  let counter = 0;

  while (currentData.length < targetSize) {
    // Add UI components
    state.ui.components[`component${counter}`] = {
      type: 'panel',
      visible: true,
      position: { x: counter * 10, y: counter * 15 },
      size: { width: 200, height: 150 },
      properties: {
        title: `Component ${counter}`,
        resizable: true,
        collapsible: false,
      },
    };

    // Add cache entries
    state.data.cache[`cache_key_${counter}`] = {
      key: `cache_key_${counter}`,
      value: `Cached value ${counter} with some additional data`,
      timestamp: Date.now() - counter * 1000,
      expiry: Date.now() + 3600000,
    };

    // Add user permissions
    state.user.permissions.push(`permission:action${counter}`);

    counter++;
    currentData = JSON.stringify(state);
  }

  return currentData.slice(0, targetSize);
}

function generateLargeConfig(targetSize: number): string {
  const config = {
    application: {
      name: 'Enterprise Application',
      services: {} as Record<string, ServiceConfig>,
      databases: {} as Record<string, unknown>,
      queues: {} as Record<string, unknown>,
    },
  };

  let currentData = JSON.stringify(config);
  let counter = 0;

  while (currentData.length < targetSize) {
    config.application.services[`service${counter}`] = {
      enabled: true,
      endpoint: `https://service${counter}.example.com`,
      timeout: 30000 + counter * 1000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000,
      },
      healthCheck: {
        path: '/health',
        interval: 30000,
        timeout: 5000,
      },
    };

    config.application.databases[`db${counter}`] = {
      type: 'postgresql',
      host: `db${counter}.example.com`,
      port: 5432,
      database: `app_db_${counter}`,
      pool: {
        min: 2,
        max: 20,
        idleTimeout: 30000,
      },
      ssl: {
        enabled: true,
        rejectUnauthorized: false,
      },
    };

    counter++;
    currentData = JSON.stringify(config);
  }

  return currentData.slice(0, targetSize);
}

function generateBase64Data(targetSize: number): string {
  // Generate binary-like data that won't compress well
  const randomBytes = new Uint8Array(Math.ceil(targetSize * 0.75)); // Base64 expands by ~33%
  for (let index = 0; index < randomBytes.length; index++) {
    // eslint-disable-next-line security/detect-object-injection
    randomBytes[index] = Math.floor(Math.random() * 256);
  }

  const base64 = Buffer.from(randomBytes).toString('base64');
  return JSON.stringify({
    type: 'binary_data',
    encoding: 'base64',
    data: base64.slice(0, targetSize - 100), // Leave room for JSON structure
  });
}

function generateRepetitiveData(targetSize: number): string {
  const pattern = {
    type: 'log_entries',
    entries: [] as LogEntry[],
  };

  const baseEntry = {
    timestamp: '2024-01-01T10:00:00Z',
    level: 'INFO',
    service: 'application-service',
    message: 'Processing request with standard parameters and configuration',
    metadata: {
      requestId: 'req-12345',
      userId: 'user-67890',
      operation: 'data_fetch',
    },
  };

  let currentData = JSON.stringify(pattern);
  let counter = 0;

  while (currentData.length < targetSize) {
    // Create mostly identical entries (highly compressible)
    pattern.entries.push({
      ...baseEntry,
      timestamp: `2024-01-01T10:${String(counter % 60).padStart(2, '0')}:00Z`,
      metadata: {
        ...baseEntry.metadata,
        requestId: `req-${12345 + counter}`,
      },
    });
    counter++;
    currentData = JSON.stringify(pattern);
  }

  return currentData.slice(0, targetSize);
}
