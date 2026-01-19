/**
 * Example custom validator that runs a build script
 * This demonstrates how consumers can add their own validation logic
 */

import { CodeValidator, ValidationResult, TestScenario } from '../../src/types';
import { execSync } from 'child_process';

export class BuildScriptValidator implements CodeValidator {
  public readonly type = 'build-script';

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    // Get custom options from the scenario's validation strategy
    const config = scenario.validationStrategy.custom?.[this.type];
    
    if (!config?.enabled) {
      return {
        passed: true,
        score: -1, // Skipped
        violations: [],
        validatorType: this.type,
      };
    }

    const options = config.options || {};
    const buildCommand = options.command || 'npm run build';
    const workingDir = options.cwd || process.cwd();

    // Validate command to prevent injection attacks
    // Only allow npm/npx commands for safety in this example
    if (!buildCommand.match(/^(npm|npx|yarn|pnpm)\s+/)) {
      return {
        passed: false,
        score: 0,
        violations: [
          {
            type: this.type,
            message: 'Invalid build command',
            severity: scenario.severity,
            details: 'Only npm, npx, yarn, and pnpm commands are allowed for security reasons',
          },
        ],
        validatorType: this.type,
      };
    }

    try {
      // Run the build script
      const output = execSync(buildCommand, {
        cwd: workingDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: options.timeout || 60000, // 60s default timeout
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
            severity: scenario.severity,
            details: error.message || String(error),
          },
        ],
        validatorType: this.type,
      };
    }
  }
}
