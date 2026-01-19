/**
 * Example usage of custom validators
 * This shows how to use custom validators with the Evaluator
 */

import { Evaluator } from '../../src/evaluator';
import { TestScenario } from '../../src/types';
import { BuildScriptValidator } from './buildScriptValidator';
import { PrettierValidator } from './prettierValidator';

async function runExample() {
  // Define a test scenario that uses custom validators
  const scenarios: TestScenario[] = [
    {
      id: 'typescript-function-with-build',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'build'],
      description: 'Create a TypeScript function that compiles successfully',
      prompt: 'Create a TypeScript function called calculateTotal that takes an array of numbers and returns the sum',
      validationStrategy: {
        patterns: {
          requiredPatterns: [/function\s+calculateTotal|const\s+calculateTotal/],
          forbiddenPatterns: [/:\s*any\b/],
        },
        // Enable custom validators
        custom: {
          'build-script': {
            enabled: true,
            options: {
              command: 'npx tsc --noEmit',
              timeout: 30000,
            },
          },
          'prettier': {
            enabled: true,
          },
        },
      },
    },
  ];

  // Create evaluator with custom validators
  const evaluator = new Evaluator({
    adapter: 'copilot',
    verbose: true,
    customValidators: [
      new BuildScriptValidator(),
      new PrettierValidator(),
    ],
  });

  // Check if adapter is available
  const available = await evaluator.checkAdapterAvailability();
  if (!available) {
    console.error('GitHub Copilot CLI is not available. Please install it first.');
    process.exit(1);
  }

  // Run evaluation
  console.log('Running evaluation with custom validators...\n');
  const report = await evaluator.evaluate(scenarios);

  // Display results
  console.log('\n=== Evaluation Report ===');
  console.log(`Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`Average score: ${report.summary.averageScore.toFixed(2)}`);
  console.log(`Total violations: ${report.summary.totalViolations}`);

  // Show detailed results
  for (const result of report.results) {
    console.log(`\n--- ${result.scenario.id} ---`);
    console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Score: ${result.score.toFixed(2)}`);
    
    if (result.violations.length > 0) {
      console.log('Violations:');
      for (const violation of result.violations) {
        console.log(`  - [${violation.type}] ${violation.message}`);
        if (violation.details) {
          console.log(`    ${violation.details}`);
        }
      }
    }
  }
}

// Run the example
runExample().catch(error => {
  console.error('Error running example:', error);
  process.exit(1);
});
