#!/bin/bash
# Local CI simulation script
# Run this to simulate CI environment locally (non-destructive)

set -e

echo "🧹 Cleaning node_modules to simulate CI..."

# Remove only node_modules (preserve package-lock.json)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

echo "📦 Installing dependencies with CI-like settings..."

# Install with same flags as CI
npm install --legacy-peer-deps

echo "🔍 Running quality checks..."

# Run the same checks as CI
just check-all

echo "✅ Local CI simulation complete!"
echo "ℹ️  Note: package-lock.json files were preserved"
