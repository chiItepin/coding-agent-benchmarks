---
name: release
description: Bump package version, publish to npm, and commit with conventional commit format. Use when releasing a new version of the package.
disable-model-invocation: true
argument-hint: [patch|minor] (optional)
---

# Release Workflow

Analyze git changes, generate a conventional commit message, bump version, publish to npm, commit, and push.

## Usage

`/release` or `/release minor`

## Steps

1. **Analyze changes**: Run `git diff --stat` to see what changed

2. **Generate conventional commit message** in the format:
   ```
   <type>(<scope>): <description>
   ```

   Where:
   - **type**: `fix`, `feat`, or `refactor` (based on changes)
   - **scope**: Topic from changed files (e.g., `deps`, `cli`, `core`, `docs`)
   - **description**: Concise summary (lowercase, no period, imperative mood)

   Example: `feat(cli): add new benchmark command`

3. **Determine version bump**:
   - If `$ARGUMENTS` is `minor` → minor bump
   - Otherwise: `feat` → minor, all others → patch

4. **Execute release**:
   - `npm version <patch|minor> --no-git-tag-version`
   - `npm run build`
   - `npm publish`
   - `git add .`
   - `git commit -m "<conventional-commit-message>"`
   - `git push`

## Conventional Commit Rules

- **Type**: `fix`, `feat`, or `refactor`
- **Scope**: Short topic in parentheses (required)
- **Description**: Lowercase, imperative mood, no period
- **Format**: `type(scope): description`

Stop if any command fails.
