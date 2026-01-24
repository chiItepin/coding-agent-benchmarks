# coding-agent-benchmarks

Open-source framework for evaluating AI coding assistants (like GitHub Copilot CLI or Claude Code) follow your coding standards. Here's the workflow:
1. You give it a prompt → 2. AI generates code → 3. Library validates → 4. You get a score

![WhatsApp Image 2026-01-23 at 9 04 49 AM](https://github.com/user-attachments/assets/3544d04f-37a5-47b0-a013-669c6015d26f)


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

# Export report as JSON
npx coding-agent-benchmarks evaluate --output report.json
```

## Auto-Generate Scenarios from Your Coding Standards

Save time by automatically generating validation scenarios from your existing coding standards!

The `/auto-scenarios` skill discovers coding standards from your project files and creates realistic test scenarios that validate whether AI coding agents follow those standards.

### What It Does

- 🔍 **Discovers standards** from CLAUDE.md, tsconfig.json, .eslintrc, .prettierrc, and more
- 📋 **Extracts actionable rules** like "No `any` types", "Use readonly for immutable data", "Single Responsibility Principle"
- ✨ **Generates synthetic scenarios** with realistic prompts that naturally test each standard
- 💾 **Writes to your config** - appends scenarios to your benchmarks.config.js

### How to Use

If you're using Claude Code CLI, simply run:

```bash
/auto-scenarios
```

The skill will:
1. Scan your project for coding standard files
2. Extract rules from each source
3. Generate diverse test scenarios
4. Show you a preview
5. Ask where to write the scenarios (append to config, create new file, etc.)

### What Gets Discovered

The skill finds standards from:

- **CLAUDE.md** / **.cursorrules** - Explicit AI coding instructions
- **tsconfig.json** - TypeScript compiler settings
- **.eslintrc*** - Linting rules
- **.prettierrc*** - Formatting preferences
- **package.json** - Project context
- **CONTRIBUTING.md** - Contribution guidelines

### Benefits

✅ **Save hours** - Generate dozens of scenarios in seconds vs. manual writing

✅ **Comprehensive** - Captures ALL your coding standards automatically

✅ **Realistic prompts** - Creates scenarios developers would actually request

✅ **Living documentation** - Standards become executable tests

✅ **Synthetic data** - Varies complexity and context for thorough testing

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

  // Enable automatic baseline saving (optional)
  saveBaseline: false,

  // Enable automatic baseline comparison (optional)
  compareBaseline: false,

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
          requiredPatterns: [/interface\s+User\b/],
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

## Scoring System

The scoring system operates at three levels: per-validator scoring, per-scenario scoring, and summary scoring.

### Per-Validator Scoring

Each validator (Pattern, LLM Judge, ESLint) independently evaluates the generated code and produces a score from 0.0 to 1.0:

#### Pattern Validator

Uses exponential decay based on weighted violations:

```
score = e^(-totalWeight)
```

Where `totalWeight` is the sum of violation weights:
- **Critical violations**: 1.0 weight each
- **Major violations**: 0.7 weight each
- **Minor violations**: 0.3 weight each

**Examples**:
- 0 violations → score = 1.0 (perfect)
- 1 critical violation → score ≈ 0.37
- 1 major violation → score ≈ 0.50
- 2 minor violations → score ≈ 0.55

#### LLM Judge Validator

The LLM (GPT-4 or other model) evaluates the code semantically and returns:
- An `overallScore` from 0.0 to 1.0
- A list of violations with explanations
- Passed if: score ≥ 0.7 AND no violations

The LLM judge provides semantic understanding beyond pattern matching, evaluating whether the code actually solves the problem correctly and follows best practices.

#### ESLint Validator

This validator runs ESLint on the generated code and scores based on the number and severity of linting violations. Note that ESLint must be installed and configured in your project for this validator to work. If you don't have ESLint set up globally, disable this validator or provide a custom validator.

Uses exponential decay with a dampening factor:

```
score = e^(-totalWeight / 2)
```

ESLint violations are mapped to severity:
- ESLint error (severity 2) → **Major** violation (0.7 weight)
- ESLint warning (severity 1) → **Minor** violation (0.3 weight)

The `/2` dampening factor makes ESLint less punitive since projects often have many minor linting issues.

### Per-Scenario Scoring

Each scenario receives an **overall score** calculated as:

```
overallScore = average of all active validator scores
```

**Active validators** are those that:
- Are configured in the scenario's `validationStrategy`
- Successfully ran (did not return score = -1)

**Pass/Fail Criteria**:
- ✅ **PASS**: `overallScore ≥ 0.8` AND `violations.length === 0`
- ❌ **FAIL**: `overallScore < 0.8` OR `violations.length > 0`
- ⚠️ **SKIP**: An error occurred during evaluation (timeout, adapter failure, etc.)

**Example**: If Pattern validator returns 0.9, LLM Judge returns 0.8, and ESLint is skipped:
```
overallScore = (0.9 + 0.8) / 2 = 0.85
```

### Summary Scoring

After evaluating all scenarios, the framework calculates summary statistics:

```javascript
{
  total: 10,              // Total number of scenarios
  passed: 7,              // Scenarios with overallScore ≥ 0.8 and no violations
  failed: 2,              // Scenarios evaluated but didn't pass
  skipped: 1,             // Scenarios that encountered errors
  averageScore: 0.78,     // Average of all scenario overallScores
  totalViolations: 8      // Sum of violations across all scenarios
}
```

**Average Score Calculation**:
```
averageScore = (sum of all scenario scores) / total scenarios
```

This includes scores from failed scenarios, providing an overall quality metric across your entire test suite.

**Transparency**: When baselines are saved, the per-validator breakdown is included in the baseline file, allowing you to trace exactly which validator contributed what score. See [Baseline File Format](#baseline-file-format) for details.

### Score Interpretation

| Score Range | Interpretation | Typical Meaning |
|-------------|----------------|-----------------|
| **1.0** | Perfect | No violations detected by any validator |
| **0.8-0.99** | Minor issues | Small violations or stylistic concerns |
| **0.5-0.79** | Moderate issues | Several violations or some significant problems |
| **0.0-0.49** | Major issues | Many violations or critical problems |

### Baseline Comparison

When baseline tracking is enabled, you'll see delta metrics:

```bash
✓ [1/3] typescript-no-any PASS (score: 0.95)
    ↑ +18.5% improvement from baseline
```

The percentage is calculated as:
```
percentage = (currentScore - baselineScore) / baselineScore * 100
```

## Baseline Tracking

Track evaluation results over time by enabling baseline management in your config file:

```javascript
// benchmarks.config.js
module.exports = {
  saveBaseline: true,
  compareBaseline: true,

  scenarios: [/* ... */],
};
```

Baselines are stored in `.benchmarks/baselines/{adapter}/{model}/{scenario-id}.json`

The `{model}` folder name depends on the adapter:
- **Copilot adapter**: `claude-sonnet-4.5` (default)
- **Claude Code adapter**: `sonnet` (default)
- Custom model names if specified via `--model` option

When `compareBaseline` is enabled, the report will show score deltas and whether results improved or regressed.

**Tip**: Add `.benchmarks/` to your `.gitignore` to keep baseline data local to each developer.

### Baseline File Format

Each baseline file contains complete transparency into how the score was calculated:

```json
{
  "scenarioId": "typescript-no-any",
  "score": 0.85,
  "violations": [
    {
      "type": "pattern",
      "message": "Forbidden pattern found: :\\s*any\\b",
      "file": "src/types.ts",
      "line": 12,
      "severity": "critical",
      "details": "Matched: \"metadata: any\""
    }
  ],
  "validationResults": [
    {
      "passed": false,
      "score": 0.37,
      "violations": [...],
      "validatorType": "pattern"
    },
    {
      "passed": true,
      "score": 1.0,
      "violations": [],
      "validatorType": "llm-judge"
    },
    {
      "passed": true,
      "score": -1,
      "violations": [],
      "validatorType": "eslint",
      "error": "ESLint not found"
    }
  ],
  "timestamp": "2026-01-23T22:28:32.216Z",
  "adapter": "copilot",
  "model": "claude-sonnet-4.5"
}
```

**Key fields**:
- `score`: Overall scenario score (average of active validators)
- `violations`: All violations from all validators combined
- `validationResults`: Per-validator breakdown showing:
  - Individual validator score
  - Whether that validator passed
  - Violations specific to that validator
  - Any errors that occurred (`score: -1` means skipped)

**Score Traceability**: With this format, you can always trace the overall score back to individual validator scores. For example, if you see `score: 0.067`, you can look at `validationResults` to see which validators contributed what scores (e.g., Pattern: 0.135, LLM Judge: 0.00).

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

## Understanding Output

When running evaluations, each scenario displays a live status that updates as it progresses:

```
Evaluating 3 scenario(s)...

✓ [1/3] typescript-no-any PASS (score: 1.00) 14.8s
✗ [2/3] react-inline-styles FAIL (score: 0.60) 22.1s
○ [3/3] async-error-handling SKIP (error) 2m 5s

============================================================
EVALUATION SUMMARY
============================================================
Total scenarios: 3
Passed: 1
Failed: 1
Skipped: 1
...
```

### Status Indicators

| Status | Symbol | Meaning |
|--------|--------|---------|
| **PASS** | ✓ | Scenario passed validation (score ≥ 0.8, no violations) |
| **FAIL** | ✗ | Scenario was evaluated but didn't pass (low score or violations) |
| **SKIP** | ○ | Scenario couldn't be evaluated due to an error |

### Common Causes for SKIP

- **Timeout**: Code generation exceeded the configured timeout
- **Adapter failure**: The CLI (Copilot or Claude Code) crashed or returned an error
- **File system errors**: Couldn't read context files or write generated code

> **Note**: In interactive terminals, you'll see a spinner animation (⠋) while scenarios are running. In CI/non-TTY environments, output falls back to simple line-by-line logging.

## Programmatic Usage

You can also use the framework programmatically:

```typescript
import { Evaluator, loadConfig } from 'coding-agent-benchmarks';

async function runEvaluation() {
  const { config, scenarios } = await loadConfig();

  // Create evaluator
  const evaluator = new Evaluator({
    adapter: 'copilot',
    model: 'openai/gpt-4.1',
    verbose: true,
    saveBaseline: config.saveBaseline,
    compareBaseline: config.compareBaseline,
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
