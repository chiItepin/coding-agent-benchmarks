# coding-agent-benchmarks

Open-source framework for evaluating AI coding assistants (like GitHub Copilot CLI or Claude Code) follow your coding standards. Here's the workflow:
1. You give it a prompt → 2. AI generates code → 3. Library validates → 4. You get a score

![WhatsApp Image 2026-01-23 at 9 04 49 AM](https://github.com/user-attachments/assets/3544d04f-37a5-47b0-a013-669c6015d26f)

*Figure 1: Evaluation workflow - prompt → generate → validate → score*

![WhatsApp Image 2026-01-24 at 1 58 31 PM](https://github.com/user-attachments/assets/f93ea3e0-74f8-4789-ab43-97245acc91b6)

*Figure 2: Example terminal output showing scenario evaluation results*


## Features

- **Multiple Adapters**: Built-in support for GitHub Copilot CLI and Claude Code CLI
- **Flexible Validation**: Pattern-based validation, LLM-as-judge semantic evaluation, and ESLint integration
- **Baseline Tracking**: Save and compare evaluation results over time
- **Extensible**: Easy to add custom scenarios, validators, and adapters
- **CLI & Programmatic API**: Use as a command-line tool or integrate into your workflow

## How It Works

The filesystem is both the **input context** (the agent reads your project structure, configs, and existing code) and the **output surface** (the agent generates or modifies files). Git is the mechanism to **observe and reset** that surface between runs.

### Workspace Cleanup

After each scenario completes, the framework automatically resets the workspace to its committed state using `git checkout` and `git clean`. This ensures:

- **Scenario isolation** — Each scenario starts from the same clean baseline, preventing leftover files from one scenario from contaminating the next.
- **Reproducible results** — The same scenario always runs against the same workspace state, regardless of execution order.
- **Validation integrity** — Validators (Pattern, ESLint, LLM Judge) only evaluate changes from the current scenario.

The `.benchmarks/` directory is excluded from cleanup so baseline results persist across scenarios.

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
  defaultModel: 'openai/gpt-5',

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
      description: 'Forbid inline style objects in React components',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/style\s*=\s*\{\{/],
          requiredPatterns: [/className/],
        },
      },
    },
    // Add more scenarios...
  ],
};
```

## Timeout Configuration

You can configure timeouts at three levels (in order of precedence):

1. **Per-scenario timeout**: Set `timeout` on individual scenarios (highest priority)
2. **Global default**: Set `defaultTimeout` in your config file
3. **Built-in default**: 120000ms (2 minutes) if nothing else is specified

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

Semantic evaluation using AI (requires `GITHUB_TOKEN`):

```javascript
validationStrategy: {
  llmJudge: {
    enabled: true,
    model: 'openai/gpt-5',
    judgmentPrompt: `Evaluate if the code follows best practices...`,
  },
}
```

### ESLint Integration

![WhatsApp Image 2026-01-24 at 2 09 11 PM](https://github.com/user-attachments/assets/12af93e8-ed7c-4153-a183-20601a925965)

*Figure 3: ESLint validator detecting code quality issues in generated code*

Run ESLint on generated code:

```javascript
validationStrategy: {
  eslint: { enabled: true, configPath: '.eslintrc.js' },
}
```

## Scoring System

### Per-Validator Scoring

Each validator independently evaluates generated code and produces a score from 0.0 to 1.0:

| Validator | Scoring Method | Notes |
|-----------|----------------|-------|
| **Pattern** | Uses exponential decay based on weighted violations | Critical: 1.0 weight, Major: 0.7 weight, Minor: 0.3 weight |
| **LLM Judge** | AI evaluates semantically, returns 0.0-1.0 score | Passes if score ≥ 0.7 AND no violations |
| **ESLint** | Exponential decay with dampening factor (÷2) | ESLint errors → Major (0.7), warnings → Minor (0.3) |

### Per-Scenario Scoring

Each scenario receives an **overall score** = **average of all active validator scores**

**Active validators** are those configured in `validationStrategy` that successfully ran (score ≠ -1).

**Pass/Fail Criteria**:
- ✅ **PASS**: `overallScore ≥ 0.8` AND `violations.length === 0`
- ❌ **FAIL**: `overallScore < 0.8` OR `violations.length > 0`
- ⚠️ **SKIP**: An error occurred during evaluation (timeout, adapter failure, etc.)

**Example**: Pattern (0.9) + LLM Judge (0.8) + ESLint (skipped) → `overallScore = (0.9 + 0.8) / 2 = 0.85`

### Summary Scoring

After evaluating all scenarios, the framework calculates:

```javascript
{
  total: 10,              // Total scenarios
  passed: 7,              // overallScore ≥ 0.8 and no violations
  failed: 2,              // Evaluated but didn't pass
  skipped: 1,             // Encountered errors
  averageScore: 0.78,     // Average of all scenario scores
  totalViolations: 8      // Sum of violations across all scenarios
}
```

**Transparency**: Baselines include per-validator breakdowns. See [Baseline File Format](#baseline-file-format) for details.

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

Path: `.benchmarks/baselines/{adapter}/{model}/{scenario-id}.json`

Each baseline file provides complete score traceability:

```json
{
  "scenarioId": "typescript-no-any",
  "score": 0.85,
  "violations": [
    { "type": "pattern", "message": "Forbidden pattern found: :\\s*any\\b", "file": "src/types.ts", ... }
  ],
  "validationResults": [
    { "passed": false, "score": 0.37, "validatorType": "pattern", "violations": [...] },
    { "passed": true, "score": 1.0, "validatorType": "llm-judge", "violations": [] },
    { "passed": true, "score": -1, "validatorType": "eslint", "error": "ESLint not found" }
  ],
  "timestamp": "2026-01-23T22:28:32.216Z",
  "adapter": "copilot",
  "model": "claude-sonnet-4.5"
}
```

**Key fields**:
- `score` - Overall scenario score (average of active validators)
- `violations` - All violations from all validators combined
- `validationResults` - Per-validator breakdown (score, passed, violations, errors)

**Traceability**: You can always trace the overall score back to individual validator scores (e.g., `score: 0.067` → check `validationResults` for Pattern: 0.135, LLM Judge: 0.00).

## CLI Commands

### `evaluate`

Run benchmark evaluations.

| Option | Description | Default/Example |
|--------|-------------|-----------------|
| `--scenario <pattern>` | Filter by scenario ID (supports wildcards) | `typescript-*` |
| `--category <categories>` | Filter by category (comma-separated) | `typescript,react` |
| `--tag <tags>` | Filter by tags (comma-separated) | `safety,types` |
| `--adapter <type>` | Adapter to use | `copilot` or `claude-code` |
| `--model <model>` | LLM model for judge | `openai/gpt-5` |
| `--threshold <number>` | Minimum passing score | `0.8` |
| `--verbose` | Show detailed output | - |
| `--output <file>` | Export JSON report | `report.json` |
| `--workspace-root <path>` | Workspace root directory | Current directory |

### `list`

List available test scenarios.

| Option | Description |
|--------|-------------|
| `--category <categories>` | Filter by category (comma-separated) |
| `--tag <tags>` | Filter by tags (comma-separated) |

### `check`

Check if coding agent CLIs are available.

### `test-llm`

Test LLM judge with a custom prompt (for debugging).

| Option | Description |
|--------|-------------|
| `--model <model>` | LLM model to use |

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

  const evaluator = new Evaluator({
    adapter: 'copilot',
    model: 'openai/gpt-5',
    verbose: true,
    saveBaseline: config.saveBaseline,
    compareBaseline: config.compareBaseline,
  });

  const report = await evaluator.evaluate(scenarios);
}

runEvaluation();
```

## Creating Custom Validators

Implement the `CodeValidator` interface:

```typescript
import { CodeValidator, ValidationResult } from 'coding-agent-benchmarks';

export class CustomValidator implements CodeValidator {
  public readonly type = 'custom';

  async validate(files: readonly string[], scenario: TestScenario): Promise<ValidationResult> {
    // Your validation logic here
    return { passed: true, score: 1.0, violations: [], validatorType: 'custom' };
  }
}
```

See CONTRIBUTING.md for complete examples.

## Creating Custom Adapters

Implement the `CodeGenerationAdapter` interface:

```typescript
import { CodeGenerationAdapter } from 'coding-agent-benchmarks';

export class CustomAdapter implements CodeGenerationAdapter {
  public readonly type = 'custom-adapter';

  async checkAvailability(): Promise<boolean> { /* ... */ }
  async generate(prompt: string, contextFiles?: readonly string[], timeout?: number): Promise<string[]> { /* ... */ }
}
```

See CONTRIBUTING.md for complete examples.

## GitHub Authentication (for LLM Judge)

LLM-as-judge validation requires GitHub authentication to access GitHub Models API. Choose one option:

### Option 1: Personal Access Token (Recommended)

Create a token at https://github.com/settings/tokens with the **`models:read`** scope, then set it as an environment variable:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Option 2: GitHub CLI (Automatic)

If GitHub CLI is installed, tokens are auto-detected:

```bash
brew install gh  # or download from https://cli.github.com
gh auth login
# Token will be used automatically - no GITHUB_TOKEN needed!
```

### Check Authentication

Run `npx coding-agent-benchmarks check` to verify authentication status.

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
