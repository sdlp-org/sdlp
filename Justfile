# https://just.systems

set dotenv-load := true

# List available commands
default:
    @just --list

# Run linting across all packages
lint:
    @echo "Running lint in specs..."
    cd specs && npm run lint
    @echo "Running lint in sdlp-sdk..."
    cd implementations/ts/sdlp-sdk && npm run lint
    @echo "Running lint in sdlp-cli..."
    cd implementations/ts/sdlp-cli && npm run lint
    @echo "Skipping sdlp-electron-demo due to network issues..."

# Format all files in the repository
format:
    @echo "Formatting files in specs..."
    cd specs && npm run format
    @echo "Formatting files in sdlp-sdk..."
    cd implementations/ts/sdlp-sdk && npm run format
    @echo "Formatting files in sdlp-cli..."
    cd implementations/ts/sdlp-cli && npm run format
    @echo "Skipping sdlp-electron-demo due to network issues..."

# Run tests across all packages
test:
    @echo "Running tests in specs..."
    cd specs && npm test
    @echo "Running tests in sdlp-sdk..."
    cd implementations/ts/sdlp-sdk && npm test
    @echo "Running tests in sdlp-cli..."
    cd implementations/ts/sdlp-cli && npm test
    @echo "Skipping sdlp-electron-demo tests due to network issues..."

# Run all quality checks (lint, format, test)
check-all:
    @echo "Running all quality checks..."
    just lint
    just format
    just test
    @echo "All quality checks completed!"
