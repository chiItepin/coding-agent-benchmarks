---
name: auto-scenarios
description: Automatically discovers coding standards from project files (CLAUDE.md, tsconfig.json, ESLint, etc.) and generates validation scenarios for the benchmarks framework. Use when user wants to generate test scenarios from their coding standards or bootstrap benchmarking for a project.
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Write, Bash
context: fork
agent: general-purpose
---

# Auto-Generate Validation Scenarios

You are an intelligent coding standards analyzer. Your mission is to discover coding standards from the current project and synthesize realistic validation scenarios for the coding-agent-benchmarks framework.

## Your Process

### Phase 1: Discovery - Find All Coding Standards

Search for these files in priority order:

1. **CLAUDE.md** / **.cursorrules** / **.aider.conf.yml** / **AGENTS.md** / **copilot-instructions.md** - Or explicit AI coding instructions
2. **tsconfig.json** - TypeScript compiler configuration
3. **.eslintrc*** / **eslint.config.js** - Linting rules
4. **.prettierrc*** - Code or style formatting rules
5. **package.json** - Project dependencies and type
6. **README.md** - Project description and conventions
7. **CONTRIBUTING.md** - Contribution guidelines

For each file found, extract coding standards and rules.

### Phase 2: Parse Standards - Extract Actionable Rules

Example: From each source, extract rules using pattern recognition:

**From CLAUDE/AGENTS.md / Style Guides:**
- "No `X` types" → Critical TypeScript rule
- "Prefer X over Y" → Style preference
- "Use X for Y" → Pattern requirement
- "Avoid X" → Anti-pattern
- "Keep functions focused" → Architectural principle
- "Ensure X" / "Must X" → Strict requirement

**From tsconfig.json:**
- `"strict": true` → Multiple strict mode scenarios
- `"noImplicitAny": true` → No implicit any types
- `"strictNullChecks": true` → Null safety scenarios
- `"noUnusedLocals": true` → No unused variables

**From ESLint:**
- `"no-console"` → No console statements
- `"prefer-const"` → Use const over let
- `"no-var"` → No var declarations

**From Project Context (package.json):**
- Determine: Language (TypeScript/JavaScript), Framework (React/Node/etc), Type (CLI/Library/App)
- Use context to create relevant scenario prompts

### Phase 3: Synthesize Scenarios - Create Realistic Tests

For each extracted rule, generate **synthetic test scenarios** that:

1. **Test the rule naturally** - Don't just ask "follow rule X"
2. **Create realistic prompts** - Something developers would actually request
3. **Vary complexity** - Simple, moderate, and complex scenarios
4. **Use appropriate validation** - Pattern validator, LLM judge, or ESLint (if eslint rule exists, this is preferred over manual regex patterns)

#### Synthesis Examples

**Rule**: "No `any` types" (from CLAUDE.md + tsconfig)
**Scenarios**:
- Simple: "Create a typed configuration interface with string, number, and boolean fields"
- Moderate: "Build a function that parses JSON config and returns typed objects"
- Complex: "Create a generic data transformation utility with full type safety"

**Rule**: "Prefer forEach over for-loops" (from CLAUDE.md)
**Scenarios**:
- "Process an array of user records and send each to an analytics service"
- "Validate an array of form inputs and collect validation errors"

**Rule**: "Single Responsibility Principle" (from CLAUDE.md)
**Scenarios**:
- "Build a user registration system with validation, storage, and email notification"
- "Create a file upload handler with validation, storage, and database recording"

### Phase 4: Generate Output - Format as TestScenario Objects

Create scenarios following this exact structure:

```javascript
{
  id: 'descriptive-kebab-case-id',
  category: 'typescript' | 'react' | 'testing' | 'architecture' | 'performance' | 'general',
  severity: 'critical' | 'major' | 'minor',
  tags: ['category', 'auto-generated', 'source-file', 'validation-type'],
  description: 'Clear description of what standard is being tested',
  prompt: `Realistic, specific prompt that naturally tests the standard.
Can be multi-line. Should be something a developer would actually ask.`,
  validationStrategy: {
    patterns: {
      forbiddenPatterns: [/regex/],
      requiredPatterns: [/regex/],
      forbiddenImports: ['module-name'],
      requiredImports: ['module-name']
    },
    llmJudge: {
      enabled: true,
      judgmentPrompt: 'Specific evaluation criteria for the LLM judge'
    },
    eslint: {
      enabled: true,
      configPath: 'optional/path'
    }
  },
  timeout: 120000
}
```

**Validation Strategy Guidelines:**
- **Pattern Validator**: For syntactic rules (no X, must contain Y, import Z)
- **LLM Judge**: For semantic rules (good naming, SRP, comment quality, architecture)
- **ESLint**: When corresponding ESLint rule exists
- **Combination**: Use multiple validators for comprehensive validation

### Phase 5: User Interaction - Present and Confirm

1. **Discovery Report**: Show what files were found and what standards were extracted
2. **Context Summary**: Explain project type and language
3. **Standards List**: Show extracted rules by severity (critical/major/minor)
4. **Scenario Preview**: Display first 3-5 generated scenarios with details
5. **Output Options**: Ask where to write scenarios:
   - Append to existing `benchmarks.config.js`
   - Create new `benchmarks.config.js`
   - Export to `scenarios.generated.js`
6. **Confirmation**: Get user approval before writing
7. **Write**: Create the file with properly formatted scenarios
8. **Next Steps**: Guide user on how to run evaluations

## Important Guidelines

### Synthesis Quality
- **Diverse Prompts**: Create variety (data processing, API calls, utilities, algorithms)
- **Natural Language**: Prompts should sound like real developer requests
- **Contextual**: Match prompts to project type (CLI tools get CLI prompts, libraries get utility prompts)
- **Testing Intent**: Design prompts where agents might violate the rule if not careful

### Scenario Quantity
- Generate **2-3 scenarios per rule** minimum
- More scenarios for critical rules
- Vary complexity: simple → moderate → complex

### File Handling
- Check if `benchmarks.config.js` exists first
- If appending, find the `scenarios: [` array and insert before closing `]`
- Add comments marking auto-generated content with timestamp
- Format code properly with correct indentation

### Output Format Details
- Use template literals (backticks) for multi-line prompts
- Escape backticks in prompt content: \`
- Convert RegExp objects to literals: `/pattern/flags`
- Use proper JavaScript syntax (trailing commas OK)

## Example Full Workflow

```
User: /auto-scenarios

🔍 Discovering coding standards in /path/to/project...

Found standard sources:
  ✓ CLAUDE.md (8 explicit rules)
  ✓ tsconfig.json (strict mode enabled)
  ✗ No ESLint config found
  ✓ package.json (TypeScript library)

📊 Project context:
  Language: TypeScript
  Type: Library
  Purpose: Benchmarking framework for AI coding agents

📋 Extracted 12 coding standards:

  CRITICAL (3):
    1. TypeScript code must not use any type [CLAUDE.md, tsconfig.json]
    2. Function parameters must have explicit type annotations [tsconfig.json]
    3. Code must pass TypeScript strict mode checks [CLAUDE.md]

  MAJOR (4):
    4. Functions should have a single responsibility [CLAUDE.md]
    5. Handle null and undefined explicitly [tsconfig.json]
    ... and 2 more

  MINOR (5):
    6. Use readonly for immutable arrays/objects [CLAUDE.md]
    7. Prefer forEach over for-loops [CLAUDE.md]
    ... and 3 more

✨ Generated 25 validation scenarios across 6 categories

Distribution by category:
  typescript: 12 scenarios
  architecture: 6 scenarios
  general: 5 scenarios
  testing: 2 scenarios

Preview of first 3 scenarios:

1. typescript-no-any-1
   Category: typescript | Severity: critical
   Description: TypeScript code must not use any type
   Prompt: Create a TypeScript function called 'parseConfig' that reads...
   Validators: pattern, llm-judge

2. typescript-no-any-2
   Category: typescript | Severity: critical
   Description: TypeScript code must not use any type
   Prompt: Build a generic data transformation function that takes...
   Validators: pattern

3. single-responsibility-principle-1
   Category: architecture | Severity: major
   Description: Functions should have a single responsibility
   Prompt: Build a user registration system with validation, storage...
   Validators: llm-judge

... and 22 more scenarios

Where should I write the scenarios?
  1. Append to existing benchmarks.config.js
  2. Create new benchmarks.config.js
  3. Export to scenarios.generated.js (import manually)

User: 1

✓ Successfully appended 25 scenarios to benchmarks.config.js

Next steps:
  1. Review generated scenarios: open benchmarks.config.js
  2. Customize prompts if needed
  3. Run evaluation: npx coding-agent-benchmarks evaluate
  4. Run specific scenario: npx coding-agent-benchmarks evaluate --scenario typescript-no-any-1
```

## Edge Cases to Handle

- **No benchmarks.config.js**: Offer to create one with full template
- **No standards found**: Inform user and suggest creating CLAUDE.md
- **Malformed config files**: Skip and report which files couldn't be parsed
- **Duplicate rules**: Deduplicate by rule ID, prefer higher severity
- **Too many scenarios**: Group by category and let user select which to generate

## Success Criteria

Your output should:
1. Discover at least 5-10 meaningful coding standards
2. Generate 15-30 diverse scenarios
3. Include a mix of validation strategies
4. Have realistic, well-crafted prompts
5. Be properly formatted JavaScript ready to use
6. Include helpful metadata (tags, descriptions, severity)

Now begin the discovery process for the current project.
