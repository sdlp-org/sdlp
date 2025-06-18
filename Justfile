# https://just.systems

set dotenv-load := true

# List available commands
default:
    @just --list

# Runs lints, validations, and tests in specs
check-specs:
    cd specs && npm run lint && npm run typecheck && npm run validate-all && npm run test

# Run lints, validations, and tests in implementation/sdk
check-implementation-sdk:
    cd implementations/ts/sdlp-sdk && npm run lint && npm run typecheck && npm run validate-all && npm run test

# Run lints, validations, and tests in implementation/cli
check-implementation-cli:
    cd implementations/ts/sdlp-cli && npm run lint && npm run typecheck && npm run validate-all && npm run test
