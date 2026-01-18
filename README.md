# coding-agent-benchmarks

Open-source framework for evaluating AI coding assistants (like GitHub Copilot CLI or Claude Code) follow your coding standards. Here's the workflow:
1. You give it a prompt → 2. AI generates code → 3. Library validates → 4. You get a score

## Features

- **Multiple Adapters**: Built-in support for GitHub Copilot CLI and Claude Code CLI
- **Flexible Validation**: Pattern-based validation, LLM-as-judge semantic evaluation, and ESLint integration
- **Baseline Tracking**: Save and compare evaluation results over time
- **Extensible**: Easy to add custom scenarios, validators, and adapters
- **CLI & Programmatic API**: Use as a command-line tool or integrate into your workflow

## Installation

```bash
npm install --save-dev coding-agent-benchmarks
```

## Quick Start

### 1. Check Adapter Availability

```bash
npx coding-agent-benchmarks check
```

This will show which coding agent CLIs are installed on your system.

### 2. List Available Scenarios

```bash
npx coding-agent-benchmarks list
```

### 3. Run Evaluations

```bash
# Run all scenarios with default adapter (Copilot)
npx coding-agent-benchmarks evaluate

# Run with Claude Code
npx coding-agent-benchmarks evaluate --adapter claude-code

# Run specific scenarios
npx coding-agent-benchmarks evaluate --scenario typescript-no-any
npx coding-agent-benchmarks evaluate --category typescript
npx coding-agent-benchmarks evaluate --tag best-practices

# Save as baseline for future comparison
npx coding-agent-benchmarks evaluate --save-baseline

# Compare with baseline
npx coding-agent-benchmarks evaluate --compare-baseline

# Export report as JSON
npx coding-agent-benchmarks evaluate --output report.json
```

## Configuration
When you run the CLI, it looks for a config file where you can customize the scenarios, validators, model and adapters (coding agents) for your project.
Create a `benchmarks.config.js` (or `.ts`) file in your project root:

```javascript
module.exports = {
  // Default adapter to use
  defaultAdapter: 'copilot',

  // Default LLM model for judge
  defaultModel: 'openai/gpt-4.1',

  // Default timeout for code generation (milliseconds)
  // Individual scenarios can override this
  // Default: 120000 (2 minutes)
  defaultTimeout: 180000, // 3 minutes

  // Workspace root (auto-detected if not specified)
  workspaceRoot: process.cwd(),

  // Custom scenarios
  scenarios: [
    {
      id: 'custom-no-any',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'types'],
      description: 'Ensure no "any" types in User interfaces',
      prompt: 'Create a User interface with name and email fields',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/],
          requiredPatterns: [/interface User/],
        },
      },
    },
  ],
};
```

## Built-in Scenarios

The framework includes 9 default scenarios:

### TypeScript

- **typescript-no-any**: Forbid `any` type usage
- **typescript-readonly-props**: Enforce readonly properties
- **typescript-explicit-return-types**: Require explicit return type annotations
- **typescript-strict-null-safety**: Proper null/undefined handling with optional chaining and type guards

### React

- **react-no-inline-styles**: Forbid inline style objects
- **react-proper-hooks**: Ensure hooks follow Rules of Hooks
- **react-key-prop**: Require unique key props in lists

### General

- **async-error-handling**: Ensure async functions have proper error handling
- **no-console-logs-production**: Forbid console.log in production code

## Timeout Configuration

You can configure timeouts at three levels (in order of precedence):

1. **Per-scenario timeout**: Set `timeout` on individual scenarios (highest priority)
2. **Global default**: Set `defaultTimeout` in your config file
3. **Built-in default**: 120000ms (2 minutes) if nothing else is specified

```javascript
// In benchmarks.config.js
module.exports = {
  // Global default applies to all scenarios
  defaultTimeout: 180000, // 3 minutes

  scenarios: [
    {
      id: 'quick-check',
      prompt: '...',
      timeout: 60000, // Override: 1 minute for this scenario
      // ...
    },
    {
      id: 'complex-task',
      prompt: '...',
      // Will use defaultTimeout (3 minutes)
      // ...
    },
  ],
};
```

**Why configure timeouts?**
- Complex code generation tasks may need more time
- Simple checks can complete faster with shorter timeouts
- Different AI models may have different response times

## Validation Strategies

### Pattern Validation

Regex-based validation for forbidden/required patterns:

```javascript
validationStrategy: {
  patterns: {
    // Patterns that should NOT appear
    forbiddenPatterns: [/:\s*any\b/, /console\.log/],

    // Patterns that MUST appear
    requiredPatterns: [/interface\s+User/],

    // Import statements that should NOT be present
    forbiddenImports: ['from "lodash"'],

    // Import statements that MUST be present
    requiredImports: ['import React'],

    // File name patterns that should NOT be created
    forbiddenFileNamePatterns: [/\.test\.js$/],

    // File name patterns that MUST be created
    requiredFileNamePatterns: [/\.tsx?$/],
  },
}
```

### LLM-as-Judge

Semantic evaluation using AI:

```javascript
validationStrategy: {
  llmJudge: {
    enabled: true,
    model: 'openai/gpt-4.1', // or 'gpt-4o'
    judgmentPrompt: `Evaluate if the code follows best practices...`,
  },
}
```

The LLM judge requires a `GITHUB_TOKEN` environment variable with access to GitHub Models API.

### ESLint Integration

Run ESLint on generated code:

```javascript
validationStrategy: {
  eslint: {
    enabled: true,
    configPath: '.eslintrc.js', // optional
  },
}
```

## Scoring

Each scenario receives a score from 0.0 to 1.0:

- **1.0**: Perfect, no violations
- **0.8-0.99**: Minor issues
- **0.5-0.79**: Moderate issues
- **0.0-0.49**: Major issues or failed

Violations are weighted by severity:
- **Critical**: 1.0 weight
- **Major**: 0.7 weight
- **Minor**: 0.3 weight

## Baseline Tracking

Save current results as a baseline:

```bash
npx coding-agent-benchmarks evaluate --save-baseline
```

Baselines are stored in `.benchmarks/baselines/{adapter}/{model}/{scenario-id}.json`

Compare future runs against the baseline:

```bash
npx coding-agent-benchmarks evaluate --compare-baseline
```

The report will show score deltas and whether results improved or regressed.

## CLI Commands

### `evaluate`

Run benchmark evaluations.

**Options:**
- `--scenario <pattern>`: Filter by scenario ID (supports wildcards like `typescript-*`)
- `--category <categories>`: Filter by category (comma-separated)
- `--tag <tags>`: Filter by tags (comma-separated)
- `--adapter <type>`: Adapter to use (`copilot` or `claude-code`)
- `--model <model>`: LLM model for judge (default: `openai/gpt-4.1`)
- `--threshold <number>`: Minimum passing score (default: `0.8`)
- `--verbose`: Show detailed output
- `--output <file>`: Export JSON report
- `--save-baseline`: Save results as baseline
- `--compare-baseline`: Compare with baseline
- `--workspace-root <path>`: Workspace root directory

### `list`

List available test scenarios.

**Options:**
- `--category <categories>`: Filter by category
- `--tag <tags>`: Filter by tags

### `check`

Check if coding agent CLIs are available.

### `test-llm`

Test LLM judge with a custom prompt (for debugging).

**Options:**
- `--model <model>`: LLM model to use

## Programmatic Usage

You can also use the framework programmatically:

```typescript
import { Evaluator, loadConfig } from 'coding-agent-benchmarks';

async function runEvaluation() {
  // Load configuration
  const { scenarios } = await loadConfig();

  // Create evaluator
  const evaluator = new Evaluator({
    adapter: 'copilot',
    model: 'openai/gpt-4.1',
    verbose: true,
  });

  // Check adapter availability
  const available = await evaluator.checkAdapterAvailability();
  if (!available) {
    throw new Error('Adapter not available');
  }

  // Run evaluation
  const report = await evaluator.evaluate(scenarios);

  console.log(`Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`Average score: ${report.summary.averageScore.toFixed(2)}`);
}

runEvaluation();
```

## Creating Custom Validators

Implement the `CodeValidator` interface:

```typescript
import { CodeValidator, ValidationResult, TestScenario } from 'coding-agent-benchmarks';

export class CustomValidator implements CodeValidator {
  public readonly type = 'custom';

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    // Your validation logic here
    return {
      passed: true,
      score: 1.0,
      violations: [],
      validatorType: 'custom',
    };
  }
}
```

## Creating Custom Adapters

Implement the `CodeGenerationAdapter` interface:

```typescript
import { CodeGenerationAdapter, AdapterType } from 'coding-agent-benchmarks';

export class CustomAdapter implements CodeGenerationAdapter {
  public readonly type: AdapterType = 'copilot'; // or extend the type

  async checkAvailability(): Promise<boolean> {
    // Check if CLI is available
    return true;
  }

  async generate(
    prompt: string,
    contextFiles?: readonly string[],
    timeout?: number
  ): Promise<string[]> {
    // Generate code and return changed files
    return ['path/to/generated/file.ts'];
  }
}
```

## GitHub Authentication (for LLM Judge)

LLM-as-judge validation requires GitHub authentication to access GitHub Models API. There are **two easy options** - no OAuth registration needed!

### Option 1: Personal Access Token (Recommended)

1. Create token at https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "coding-agent-benchmarks")
4. Select scope: **`models:read`**
5. Generate and copy the token
6. Set environment variable:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

### Option 2: GitHub CLI (Automatic)

If you have GitHub CLI installed, tokens are auto-detected:

```bash
# Install GitHub CLI
brew install gh          # macOS
# or download from https://cli.github.com

# Authenticate (one time)
gh auth login

# Token will be used automatically - no GITHUB_TOKEN needed!
```

### Check Authentication Status

```bash
npx coding-agent-benchmarks check
```

Output:
```
Checking adapter availability...
  GitHub Copilot CLI: ✓ Available
  Claude Code CLI: ✗ Not found

Checking GitHub authentication...
  ✓ Using token from GitHub CLI (gh auth token)
```

## How It Works

1. **Code Generation**: The adapter spawns a coding agent CLI with a prompt
2. **File Tracking**: Git is used to detect which files were created/modified
3. **Validation**: Multiple validators check the generated code
4. **Scoring**: Results are aggregated and compared against thresholds
5. **Reporting**: Results are displayed in terminal and optionally exported as JSON

## Requirements

- Node.js >= 18.0.0
- Git repository (for file change tracking)
- At least one coding agent CLI installed (Copilot or Claude Code)
- (Optional) `GITHUB_TOKEN` for LLM judge validation

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

Inspired by the need for systematic evaluation of AI coding assistants. Built to help teams ensure their AI tools follow coding standards and best practices.

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/coding-agent-benchmarks/issues)
- Documentation: This README and inline JSDoc comments
- Examples: See `examples/` directory (coming soon)

---

**Happy benchmarking!** 🚀
