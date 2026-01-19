# Contributing to coding-agent-benchmarks

Thank you for your interest in contributing to coding-agent-benchmarks!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/coding-agent-benchmarks.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Test your changes: `npm run dev -- check`

## Development Workflow

### Project Structure

```
src/
├── adapters/           # Code generation adapters
│   ├── copilotCLI.ts
│   └── claudeCodeCLI.ts
├── validators/         # Code validators
│   ├── patternValidator.ts
│   ├── llmJudge.ts
│   └── eslintValidator.ts
├── config/            # Configuration loading
│   └── loader.ts
├── utils/             # Utility functions
│   ├── gitUtils.ts
│   ├── workspaceUtils.ts
│   └── baselineManager.ts
├── types.ts           # TypeScript type definitions
├── evaluator.ts       # Main evaluation engine
├── runner.ts          # CLI interface
└── index.ts           # Public API exports
```

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Build: `npm run build`
4. Test locally: `npm link` then test in another project
5. Commit with clear messages: `git commit -m "Add feature: description"`
6. Push: `git push origin feature/your-feature-name`
7. Create a Pull Request

### Coding Standards

- Use TypeScript for all code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Avoid external dependencies unless necessary

### Adding a New Adapter

1. Create a new file in `src/adapters/`
2. Implement the `CodeGenerationAdapter` interface
3. Export the adapter from `src/index.ts`
4. Update the adapter type in `src/types.ts`
5. Add adapter support in `src/evaluator.ts`
6. Document in README.md

Example:

```typescript
// src/adapters/myAdapter.ts
import { CodeGenerationAdapter } from '../types';

export class MyAdapter implements CodeGenerationAdapter {
  public readonly type = 'my-adapter' as const;

  async checkAvailability(): Promise<boolean> {
    // Implementation
  }

  async generate(prompt: string): Promise<string[]> {
    // Implementation
  }
}
```

### Adding a New Validator

1. Create a new file in `src/validators/`
2. Implement the `CodeValidator` interface
3. Export the validator from `src/index.ts`
4. Integrate into `src/evaluator.ts`
5. Document in README.md

## Testing

Currently, we don't have automated tests (contributions welcome!). Please test manually:

1. Build: `npm run build`
2. Link: `npm link`
3. Test in a sample project:
   ```bash
   mkdir test-project
   cd test-project
   git init
   npm link coding-agent-benchmarks
   npx coding-agent-benchmarks check
   npx coding-agent-benchmarks list
   ```

## Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Include a clear description of what changed and why
- Reference any related issues
- Update documentation if needed
- Ensure the build passes: `npm run build`

## Reporting Issues

When reporting issues, please include:

- Node.js version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Any error messages or logs

## Feature Requests

We welcome feature requests! Please:

- Search existing issues first
- Clearly describe the use case
- Explain why it would be useful
- Be open to discussion about implementation

## Code of Conduct

Be respectful and considerate. We're all here to build something useful together.

## Questions?

Open an issue with the "question" label or start a discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
