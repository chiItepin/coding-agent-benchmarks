---
name: release
description: Bump package version, publish to npm, and commit with conventional commit format. Use when releasing a new version of the package.
disable-model-invocation: true
argument-hint: [patch|minor] (optional)
---

# Release Workflow

Bump the package version, publish to npm, create a conventional commit based on git changes, and push.

## Arguments

Optional:
- **version type**: `patch` or `minor` (default: `patch`)

Example: `/release` or `/release minor`

## Steps

1. **Analyze git context**:
   - Run `git diff --stat HEAD` to see uncommitted changes
   - Run `git log --oneline -5` to see recent commit history
   - Examine what files changed and the nature of changes

2. **Generate commit message**:
   Based on the git context, determine:
   - **type**: `fix`, `feat`, or `refactor` based on the nature of changes
   - **topic**: Infer from changed files/directories (e.g., `deps`, `cli`, `core`, `docs`)
   - **message**: Summarize what changed in a concise description

   Format: `<type>(<topic>): <message>`

3. **Determine version bump**:
   - Use `$ARGUMENTS` if provided (`patch` or `minor`)
   - Otherwise: `feat` → minor, `fix`/`refactor` → patch

4. **Show plan**: Display the proposed commit message and version bump to the user for confirmation

5. **Bump version**: Run `npm version <patch|minor> --no-git-tag-version`

6. **Build**: Run `npm run build` to ensure the build succeeds

7. **Publish**: Run `npm publish`

8. **Stage changes**: Run `git add .`

9. **Commit**: Create commit with the generated conventional commit message

10. **Create git tag**: Run `git tag v<new-version>`

11. **Push**: Run `git push && git push --tags`

## Commit Message Guidelines

When analyzing git context:
- **fix**: Bug fixes, security patches, dependency updates for vulnerabilities
- **feat**: New features, new commands, new capabilities
- **refactor**: Code restructuring, cleanup, performance improvements without behavior change

Topic examples:
- `deps` - dependency changes
- `cli` - command-line interface changes
- `core` - core functionality changes
- `build` - build system changes
- `docs` - documentation changes
- `types` - TypeScript type changes

## Error Handling

- If any step fails, stop and report the error
- Do not continue to publish if build fails
- Do not commit/push if publish fails
