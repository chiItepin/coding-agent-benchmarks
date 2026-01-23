# Auto-Scenarios Skill

Automatically generate validation scenarios from your project's coding standards.

## What It Does

This Claude Code skill discovers coding standards from multiple sources in your project (CLAUDE.md, tsconfig.json, ESLint configs, etc.) and synthesizes realistic test scenarios that validate whether AI coding agents follow those standards.

## How to Use

Simply invoke the skill:

```bash
/auto-scenarios
```

The skill will:
1. 🔍 Discover coding standard files in your project
2. 📋 Extract actionable rules from each source
3. ✨ Generate synthetic validation scenarios
4. 💾 Write scenarios to your benchmarks config

## What It Discovers

- **CLAUDE.md** / **.cursorrules** - Explicit AI coding instructions
- **tsconfig.json** - TypeScript strictness rules
- **.eslintrc*** - Linting rules
- **.prettierrc*** - Formatting preferences
- **package.json** - Project context
- **CONTRIBUTING.md** - Contribution guidelines

## Example Output

For a TypeScript project with CLAUDE.md containing "No `any` types", the skill generates:

```javascript
{
  id: 'typescript-no-any-1',
  category: 'typescript',
  severity: 'critical',
  tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
  description: 'TypeScript code must not use any type',
  prompt: `Create a TypeScript function called 'parseConfig' that reads a JSON
configuration file and returns a typed configuration object with properties:
apiUrl (string), timeout (number), retryAttempts (number), and headers (object
with string keys and string values).`,
  validationStrategy: {
    patterns: {
      forbiddenPatterns: [/:\s*any\b/]
    },
    llmJudge: {
      enabled: true,
      judgmentPrompt: 'Check that all function parameters have explicit type annotations...'
    }
  },
  timeout: 120000
}
```

## Key Features

### Intelligent Discovery
- Scans multiple standard sources automatically
- Understands project context (language, framework, type)
- Extracts actionable rules from various formats

### Synthetic Scenario Generation
- Creates **realistic prompts** that developers would actually use
- Generates **multiple scenarios per rule** with varying complexity
- Designs scenarios where agents might naturally violate rules
- Contextualizes prompts based on project type

### Smart Validation Strategy Selection
- **Pattern validators** for syntactic rules (no `any`, required imports)
- **LLM judges** for semantic rules (SRP, naming quality, comment quality)
- **ESLint validators** when corresponding rules exist
- **Combined strategies** for comprehensive validation

### Flexible Output
- Append to existing `benchmarks.config.js`
- Create new config file
- Export to separate `scenarios.generated.js` for manual import

## Benefits

✅ **Save Time**: Generate dozens of scenarios in seconds vs. hours of manual work

✅ **Comprehensive**: Captures ALL your coding standards automatically

✅ **Living Documentation**: Standards become executable tests

✅ **Synthetic Data**: Creates diverse, realistic test cases

✅ **Quality Assurance**: Ensures coding agents respect your standards

## Requirements

- Git repository
- At least one coding standard file
- coding-agent-benchmarks framework installed

## For This Repository

When run in the coding-agent-benchmarks repository itself, this skill generates scenarios validating:

- No `any` types (TypeScript strictness)
- Prefer forEach over for-loops (style preference)
- Single Responsibility Principle (architecture)
- Use readonly for immutable data (TypeScript immutability)
- Meaningful comments (code quality)
- And many more...

## How It Works

The skill runs as a forked general-purpose agent with access to Read, Glob, Grep, Write, and Bash tools. It:

1. Uses Glob to find standard files
2. Uses Read to parse file contents
3. Applies pattern matching to extract rules
4. Synthesizes diverse test scenarios
5. Formats output as valid JavaScript
6. Writes to benchmarks config

## Supporting Files

- **SKILL.md**: Main skill instructions (this file's sibling)
- **scripts/helpers.ts**: TypeScript utilities for parsing and generation
- **README.md**: This documentation

## Integration Example

After generating scenarios, run them:

```bash
# Run all auto-generated scenarios
npx coding-agent-benchmarks evaluate --tag auto-generated

# Run specific category
npx coding-agent-benchmarks evaluate --category typescript

# Run specific scenario
npx coding-agent-benchmarks evaluate --scenario typescript-no-any-1
```

## Customization

Generated scenarios are starting points. You can:
- Edit prompts for more specific requirements
- Adjust severity levels
- Add/remove validation strategies
- Include context files for more complex scenarios
- Modify timeout values

## Future Enhancements

- Support for more file types (.editorconfig, .nvmrc)
- Custom rule definition format
- Scenario complexity scoring
- Automatic baseline generation
- CI/CD integration templates
- Interactive scenario refinement

## Example Run

```
$ /auto-scenarios

🔍 Discovering coding standards in /path/to/project...

Found standard sources:
  ✓ CLAUDE.md (8 explicit rules)
  ✓ tsconfig.json (strict mode enabled)
  ✗ No ESLint config found

📊 Project context:
  Language: TypeScript
  Type: Library
  Purpose: Benchmarking framework

📋 Extracted 12 standards:
  CRITICAL (3): No any types, Explicit params, Strict mode
  MAJOR (4): Single responsibility, Null handling, ...
  MINOR (5): Use readonly, Prefer forEach, ...

✨ Generated 25 validation scenarios

Distribution:
  typescript: 12 scenarios
  architecture: 6 scenarios
  general: 5 scenarios
  testing: 2 scenarios

Preview first 3 scenarios...

Where should I write scenarios? [1-3]: 1

✓ Successfully appended 25 scenarios to benchmarks.config.js

Next steps:
  1. Review: open benchmarks.config.js
  2. Customize: edit prompts as needed
  3. Run: npx coding-agent-benchmarks evaluate
```

## Troubleshooting

**No standards found?**
- Ensure you have CLAUDE.md, tsconfig.json, or .eslintrc*
- The skill needs at least one source file

**Scenarios not relevant?**
- Edit generated scenarios to better match your needs
- They're templates - customization is expected

**Too many/few scenarios?**
- Adjust the rules in your standard files
- Delete unwanted scenarios after generation

## Contributing

To improve this skill:
1. Add support for new file types
2. Enhance pattern matching in helpers.ts
3. Add more prompt templates for different scenarios
4. Improve validation strategy selection logic

## License

MIT - Same as coding-agent-benchmarks
