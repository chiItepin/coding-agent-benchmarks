# Claude.md - Coding Agent Instructions

## Repository Overview

This is **coding-agent-benchmarks**, an open-source framework for evaluating AI coding assistants (like GitHub Copilot CLI or Claude Code) against coding standards and best practices.

**Core Purpose**: Test if AI coding agents follow your coding standards by running prompts through them and validating the generated code.

## Project Structure

```
src/
├── adapters/           # Code generation adapters (Copilot CLI, Claude Code CLI)
├── validators/         # Code validators (pattern, LLM judge, ESLint)
├── config/            # Configuration loading
├── utils/             # Utility functions (git, workspace, baseline)
├── types.ts           # TypeScript type definitions
├── evaluator.ts       # Main evaluation engine
├── runner.ts          # CLI interface
└── index.ts           # Public API exports
```

## Coding Standards

### TypeScript
- **Use TypeScript for all code** - This is a TypeScript project
- **Strict mode enabled** - Follow strict TypeScript settings in `tsconfig.json`
- **No `any` types** - Use explicit types everywhere
- **Target ES2020** - Modern JavaScript features are allowed
- **Module system**: CommonJS (`module: "commonjs"`)

### Code Style
- **Use JSDoc comments** for public APIs and exported functions
- **Keep functions focused** - Single responsibility principle
- **Avoid external dependencies** unless absolutely necessary
- **Use readonly** for arrays/objects that shouldn't be mutated
- **Use const assertions** for literal types (e.g., `as const`)

### File Organization
- **One class/interface per file** when possible
- **Group related functionality** in subdirectories
- **Export from index.ts** for public APIs
- **Keep types in types.ts** for shared type definitions

### Naming Conventions
- **PascalCase** for classes and interfaces (`EvaluatorOptions`, `CodeValidator`)
- **camelCase** for functions and variables (`checkAvailability`, `workspaceRoot`)
- **UPPER_SNAKE_CASE** for constants
- **Descriptive names** - Prefer clarity over brevity

## Build & Development

### Commands
```bash
# Build the project (TypeScript compilation)
npm run build

# Development mode (run without building)
npm run dev -- <command>

# Example: npm run dev -- check
```

### Output
- Compiled JavaScript goes to `dist/` directory
- Source maps and declaration files are generated
- CLI entry point: `dist/runner.js`

## Testing

**Note**: Currently no automated test suite exists (contributions welcome!)

### Manual Testing
```bash
npm run build
npm link
# Test in a sample project
mkdir test-project && cd test-project
git init
npm link coding-agent-benchmarks
npx coding-agent-benchmarks check
```

### Test Behavior
- Always test in a Git repository (file tracking requires Git)
- Test both adapters if possible (Copilot and Claude Code)
- Test validation strategies (patterns, LLM judge, ESLint)

## Contributing Guidelines

### Making Changes
1. **Focus on single features** - One PR, one feature/fix
2. **Preserve existing behavior** - Don't break backward compatibility
3. **Update documentation** - README.md if adding features
4. **Build must pass** - Run `npm run build` before committing
5. **Manual testing required** - Test your changes locally

### Adding New Adapters
1. Create file in `src/adapters/`
2. Implement `CodeGenerationAdapter` interface
3. Add type to `AdapterType` union in `src/types.ts`
4. Update `createAdapter()` in `src/evaluator.ts`
5. Export from `src/index.ts`
6. Document in README.md

### Adding New Validators
1. Create file in `src/validators/`
2. Implement `CodeValidator` interface
3. Integrate in `src/evaluator.ts`
4. Export from `src/index.ts`
5. Document in README.md

## Important Concepts

### Adapters
Adapters interface with different coding agent CLIs:
- `CopilotCLIAdapter` - GitHub Copilot CLI
- `ClaudeCodeCLIAdapter` - Claude Code CLI

Each adapter must:
- Check CLI availability
- Generate code from prompts
- Return list of changed files

### Validators
Validators check generated code quality:
- `PatternValidator` - Regex-based pattern matching
- `LLMJudgeValidator` - AI-powered semantic evaluation
- `ESLintValidator` - ESLint integration

### Scenarios
Test scenarios define:
- Prompt for code generation
- Validation strategy
- Expected behavior
- Scoring criteria

### Scoring
- **1.0** = Perfect (no violations)
- **0.8-0.99** = Minor issues
- **0.5-0.79** = Moderate issues
- **0.0-0.49** = Major issues/failed

## Dependencies

### Runtime
- `commander` - CLI argument parsing

### Development
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution for development
- `eslint` - Linting (available but not enforced)
- `prettier` - Code formatting (available but not enforced)
- `@types/node` - Node.js type definitions

## Git Workflow

### File Tracking
- Uses Git to detect file changes
- Requires working in a Git repository
- Uses `git status --porcelain` and `git diff`

### Baseline Management
- Baselines stored in `.benchmarks/baselines/`
- Structure: `{adapter}/{model}/{scenario-id}.json`
- Add `.benchmarks/` to `.gitignore` for user configs

## Requirements

- **Node.js >= 18.0.0** - Minimum version
- **Git repository** - Required for file change tracking
- **Coding agent CLI** - At least one (Copilot or Claude Code)
- **GITHUB_TOKEN** - Optional, for LLM judge validation

## Common Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  throw new Error(`Descriptive message: ${error}`);
}
```

### Async/Await
```typescript
const operation = async (): Promise<Result> => {
  // Always use async/await, not callbacks
};
```

### Type Safety
```typescript
// Good: Explicit types
const validate = (files: readonly string[]): ValidationResult => {
  // ...
};

// Avoid: Implicit any
const process = (data) => { // ❌ No type
  // ...
};
```

## Documentation

- **README.md** - User-facing documentation, installation, usage
- **CONTRIBUTING.md** - Developer guide, contribution workflow
- **JSDoc comments** - API documentation in code
- **This file (claude.md)** - Coding agent instructions

## License

MIT License - See LICENSE file
