# coding-agent-benchmarks

Open-source framework for evaluating AI coding assistants (like GitHub Copilot CLI or Claude Code) follow your coding standards. Here's the workflow:
1. You give it a prompt → 2. AI generates code → 3. Library validates → 4. You get a score

## Features

- **Multiple Adapters**: Built-in support for GitHub Copilot CLI and Claude Code CLI
- **Flexible Validation**: Pattern-based validation, LLM-as-judge semantic evaluation, ESLint integration, and custom validators
- **Baseline Tracking**: Save and compare evaluation results over time
- **Extensible**: Easy to add custom scenarios, validators, and adapters
- **CLI & Programmatic API**: Use as a command-line tool or integrate into your workflow

## Installation

```bash
npm install --save-dev coding-agent-benchmarks
```

## Quick Start

### 1. Create a Configuration File

Create a `benchmarks.config.js` file in your project root with your scenarios (see Configuration section below).

### 2. Check Adapter Availability

```bash
npx coding-agent-benchmarks check
```

This will show which coding agent CLIs are installed on your system.

### 3. List Your Scenarios

```bash
npx coding-agent-benchmarks list
```

### 4. Run Evaluations

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

**Configuration is required.** Create a `benchmarks.config.js` (or `.ts`) file in your project root with your test scenarios:

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

  // Define your test scenarios
  scenarios: [
    {
      id: 'typescript-no-any',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'types', 'safety'],
      description: 'Ensure TypeScript interfaces use explicit types instead of "any"',
      prompt: 'Create a TypeScript interface called User with fields: id (number), name (string), email (string), and metadata (object with key-value pairs)',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/],
          requiredPatterns: [/interface\s+User/],
        },
      },
      timeout: 120000,
    },
    {
      id: 'react-no-inline-styles',
      category: 'react',
      severity: 'major',
      tags: ['react', 'styling', 'best-practices'],
      description: 'Forbid inline style objects in React components',
      prompt: 'Create a React functional component called Button that accepts a "label" prop and renders a styled button. Use CSS classes instead of inline styles.',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/style\s*=\s*\{\{/, /style\s*=\s*\{[^}]*\}/],
          requiredPatterns: [/className/],
        },
      },
    },
    {
      id: 'async-error-handling',
      category: 'general',
      severity: 'critical',
      tags: ['async', 'error-handling', 'robustness'],
      description: 'Ensure async functions have proper error handling',
      prompt: 'Create an async function called fetchUserData that takes a userId parameter, makes an HTTP request to fetch user data, and returns the user object. Handle errors appropriately.',
      validationStrategy: {
        patterns: {
          requiredPatterns: [/async\s+function\s+fetchUserData|const\s+fetchUserData.*async/, /try|catch|\.catch\(/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: 'Evaluate the error handling in this async function. Does it use try/catch or .catch()? Are errors logged or re-thrown appropriately?',
        },
      },
    },
  ],
};
```

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

### Custom Validators

You can add your own validators for domain-specific checks like build scripts, additional linters (stylelint, prettier), or custom quality checks:

```javascript
validationStrategy: {
  // ... other validators
  custom: {
    'build-script': {
      enabled: true,
      options: {
        command: 'npm run build',
        cwd: process.cwd(),
      },
    },
    'stylelint': {
      enabled: true,
    },
  },
}
```

See the [Creating Custom Validators](#creating-custom-validators) section for implementation details.

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

You can extend the validation system by implementing custom validators for domain-specific checks like running build scripts, checking for specific patterns, or integrating other linters.

### Step 1: Implement the `CodeValidator` Interface

```typescript
import { CodeValidator, ValidationResult, TestScenario } from 'coding-agent-benchmarks';
import { execSync } from 'child_process';
import * as path from 'path';

export class BuildScriptValidator implements CodeValidator {
  public readonly type = 'build-script';

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    try {
      // Get custom options from the scenario's validation strategy
      const options = scenario.validationStrategy.custom?.[this.type]?.options;
      const buildCommand = options?.command || 'npm run build';
      const workingDir = options?.cwd || process.cwd();

      // Run the build script
      execSync(buildCommand, {
        cwd: workingDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      return {
        passed: true,
        score: 1.0,
        violations: [],
        validatorType: this.type,
      };
    } catch (error: any) {
      return {
        passed: false,
        score: 0,
        violations: [
          {
            type: this.type,
            message: 'Build script failed',
            severity: 'critical',
            details: error.message,
          },
        ],
        validatorType: this.type,
      };
    }
  }
}
```

### Step 2: Register Custom Validators with the Evaluator

When using the programmatic API, pass your custom validators to the `Evaluator`:

```typescript
import { Evaluator, loadConfig } from 'coding-agent-benchmarks';
import { BuildScriptValidator } from './validators/buildScript';

async function runEvaluation() {
  const { scenarios } = await loadConfig();

  const evaluator = new Evaluator({
    adapter: 'copilot',
    model: 'openai/gpt-4.1',
    verbose: true,
    customValidators: [
      new BuildScriptValidator(),
      // Add more custom validators here
    ],
  });

  const report = await evaluator.evaluate(scenarios);
  console.log(`Average score: ${report.summary.averageScore.toFixed(2)}`);
}
```

### Step 3: Enable Custom Validators in Scenarios

Configure which scenarios should use your custom validators:

```javascript
// In benchmarks.config.js
module.exports = {
  scenarios: [
    {
      id: 'react-component-builds',
      category: 'react',
      severity: 'critical',
      tags: ['react', 'build'],
      description: 'Ensure generated React components compile successfully',
      prompt: 'Create a React component called UserProfile...',
      validationStrategy: {
        patterns: {
          requiredPatterns: [/export\s+(default\s+)?function\s+UserProfile/],
        },
        // Enable your custom validator
        custom: {
          'build-script': {
            enabled: true,
            options: {
              command: 'npm run build',
              cwd: process.cwd(),
            },
          },
        },
      },
    },
  ],
};
```

### Example: Custom Stylelint Validator

```typescript
import { CodeValidator, ValidationResult, TestScenario } from 'coding-agent-benchmarks';
import { execSync } from 'child_process';
import * as fs from 'fs';

export class StylelintValidator implements CodeValidator {
  public readonly type = 'stylelint';

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    const violations = [];
    
    // Filter for CSS/SCSS files
    const styleFiles = files.filter(f => /\.(css|scss|sass)$/.test(f));
    
    if (styleFiles.length === 0) {
      return {
        passed: true,
        score: -1, // Skipped
        violations: [],
        validatorType: this.type,
      };
    }

    try {
      for (const file of styleFiles) {
        const output = execSync(`npx stylelint "${file}" --formatter json`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        const results = JSON.parse(output);
        for (const result of results) {
          for (const warning of result.warnings || []) {
            violations.push({
              type: this.type,
              message: `${warning.rule}: ${warning.text}`,
              file: file,
              line: warning.line,
              severity: warning.severity === 'error' ? 'major' : 'minor',
            });
          }
        }
      }

      return {
        passed: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.5,
        violations,
        validatorType: this.type,
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        violations: [],
        validatorType: this.type,
        error: `Stylelint validation failed: ${error}`,
      };
    }
  }
}
```

Then use it in your evaluation:

```typescript
const evaluator = new Evaluator({
  adapter: 'copilot',
  customValidators: [new StylelintValidator()],
});
```

And enable it in your scenarios:

```javascript
{
  id: 'css-best-practices',
  prompt: 'Create a CSS file with button styles...',
  validationStrategy: {
    custom: {
      'stylelint': {
        enabled: true,
      },
    },
  },
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
