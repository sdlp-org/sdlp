# Release Process

This repository uses [Release Please](https://github.com/googleapis/release-please) to automate versioning, changelog generation, and release tagging based on [Conventional Commits](https://www.conventionalcommits.org/).

## How It Works

1. **Conventional Commits**: All commits to the `main` branch should follow the Conventional Commits specification
2. **Automated PRs**: Release Please automatically creates release pull requests when it detects releasable changes
3. **Version Bumping**: Versions are automatically bumped based on commit types
4. **Changelog Generation**: Changelogs are automatically generated from commit messages

## Conventional Commit Format

Commits should follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Breaking Changes

To indicate a breaking change, add `!` after the type/scope or include `BREAKING CHANGE:` in the footer:

```
feat!: remove deprecated API endpoint

BREAKING CHANGE: The /v1/old-endpoint has been removed. Use /v2/new-endpoint instead.
```

## Examples

### Feature Addition
```
feat(sdk): add support for Brotli compression

Implements Brotli compression for payload optimization.
Reduces average payload size by 30%.
```

### Bug Fix
```
fix(cli): handle missing key file gracefully

Previously, the CLI would crash when a key file was missing.
Now it shows a helpful error message and exits cleanly.
```

### Documentation Update
```
docs: update installation instructions

Add npm installation steps and troubleshooting section.
```

### Breaking Change
```
feat(sdk)!: change createLink API signature

BREAKING CHANGE: createLink now requires options parameter.
Migration: createLink(payload, key) -> createLink(payload, key, {})
```

## Release Workflow

1. **Development**: Make changes using conventional commits
2. **Automatic Detection**: Release Please monitors commits on `main` branch
3. **Release PR Creation**: When releasable changes are detected, Release Please creates a PR with:
   - Updated version numbers in `package.json` files
   - Generated `CHANGELOG.md` entries
   - Git tags for the release
4. **Review and Merge**: Review the release PR and merge when ready
5. **Automatic Release**: Merging the release PR triggers the actual release

## Package Versioning

This repository contains multiple packages that are versioned independently:

- **sdlp-sdk** (`implementations/ts/sdlp-sdk/`)
- **sdlp-cli** (`implementations/ts/sdlp-cli/`)
- **sdlp-demo** (`implementations/ts/sdlp-electron-demo/`)

Each package will have its own release cycle based on the changes made to that specific package.

## Manual Release (Emergency)

In case manual intervention is needed:

1. Update version numbers manually in the affected `package.json` files
2. Update `CHANGELOG.md` files with the new version and changes
3. Create a git tag: `git tag v1.2.3`
4. Push the tag: `git push origin v1.2.3`

## Troubleshooting

### Release Please Not Creating PRs

- Ensure commits follow Conventional Commits format
- Check that commits contain releasable changes (feat, fix, etc.)
- Verify the bootstrap SHA is correct in `release-please-config.json`

### Version Conflicts

- Release Please handles version conflicts automatically
- If manual resolution is needed, edit the release PR directly

### Missing Changelog Entries

- Ensure commit messages are descriptive and follow the conventional format
- Breaking changes must include `BREAKING CHANGE:` in the footer or `!` after the type

## Configuration

Release Please configuration is stored in:

- `release-please-config.json` - Main configuration
- `.release-please-manifest.json` - Version tracking (auto-generated)
- `.github/workflows/release-please.yml` - GitHub Actions workflow

For more information, see the [Release Please documentation](https://github.com/googleapis/release-please).
