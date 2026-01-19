# Custom Validators Examples

This directory contains examples of custom validators that can be used with the coding-agent-benchmarks library.

## Examples

### 1. BuildScriptValidator (`buildScriptValidator.ts`)

A validator that runs a build script to ensure generated code compiles successfully.

**Features:**
- Configurable build command (default: `npm run build`)
- Configurable working directory
- Configurable timeout
- Returns violations if build fails

**Usage:**
```typescript
import { BuildScriptValidator } from './examples/custom-validators/buildScriptValidator';

const evaluator = new Evaluator({
  adapter: 'copilot',
  customValidators: [new BuildScriptValidator()],
});
```

**Configuration in scenario:**
```javascript
validationStrategy: {
  custom: {
    'build-script': {
      enabled: true,
      options: {
        command: 'npx tsc --noEmit',  // TypeScript check
        cwd: process.cwd(),
        timeout: 30000,
      },
    },
  },
}
```

### 2. PrettierValidator (`prettierValidator.ts`)

A validator that checks if generated code is formatted according to Prettier rules.

**Features:**
- Automatically checks all generated files
- Uses `prettier --check` to validate formatting
- Returns minor violations for unformatted files
- Provides helpful error messages

**Usage:**
```typescript
import { PrettierValidator } from './examples/custom-validators/prettierValidator';

const evaluator = new Evaluator({
  adapter: 'copilot',
  customValidators: [new PrettierValidator()],
});
```

**Configuration in scenario:**
```javascript
validationStrategy: {
  custom: {
    'prettier': {
      enabled: true,
    },
  },
}
```

### 3. Complete Usage Example (`usage-example.ts`)

A complete example showing how to:
- Define test scenarios with custom validators
- Create an evaluator with multiple custom validators
- Run evaluations and display results

**Run the example:**
```bash
# Make sure you have the library built
npm run build

# Run the example
npx tsx examples/custom-validators/usage-example.ts
```

## Creating Your Own Custom Validator

To create a custom validator:

1. Implement the `CodeValidator` interface from `coding-agent-benchmarks`
2. Define a unique `type` property (e.g., `'my-validator'`)
3. Implement the `validate()` method that:
   - Checks if the validator is enabled in the scenario
   - Performs your validation logic
   - Returns a `ValidationResult` with violations

**Template:**
```typescript
import { CodeValidator, ValidationResult, TestScenario } from 'coding-agent-benchmarks';

export class MyCustomValidator implements CodeValidator {
  public readonly type = 'my-validator';

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    const config = scenario.validationStrategy.custom?.[this.type];
    
    if (!config?.enabled) {
      return {
        passed: true,
        score: -1, // Skipped
        violations: [],
        validatorType: this.type,
      };
    }

    // Your validation logic here
    const violations = [];
    
    // ... perform checks ...

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 1.0 : 0.5,
      violations,
      validatorType: this.type,
    };
  }
}
```

## Common Use Cases

### Build/Compile Checks
- TypeScript: `npx tsc --noEmit`
- Webpack: `npm run build`
- Rollup: `npm run build`

### Additional Linters
- Stylelint for CSS/SCSS
- Prettier for formatting
- Markdownlint for documentation
- Shellcheck for shell scripts

### Custom Quality Checks
- Security scans (e.g., Snyk, npm audit)
- Performance benchmarks
- Bundle size checks
- Accessibility checks

### Domain-Specific Validation
- API contract validation
- Database schema validation
- Configuration file validation
- License header checks

## Tips

1. **Skip when not applicable**: Return `score: -1` when the validator doesn't apply
2. **Use appropriate severity**: Match severity to the impact (critical/major/minor)
3. **Provide helpful details**: Include actionable information in violation details
4. **Handle errors gracefully**: Catch exceptions and return proper error results
5. **Make it configurable**: Use the `options` field for validator-specific configuration
