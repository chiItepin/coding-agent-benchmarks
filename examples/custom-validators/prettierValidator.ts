/**
 * Example custom validator for Prettier formatting
 * This demonstrates how to integrate additional linters/formatters
 */

import { CodeValidator, ValidationResult, TestScenario } from '../../src/types';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class PrettierValidator implements CodeValidator {
  public readonly type = 'prettier';
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    const config = scenario.validationStrategy.custom?.[this.type];
    
    if (!config?.enabled) {
      return {
        passed: true,
        score: -1,
        violations: [],
        validatorType: this.type,
      };
    }

    const violations = [];

    try {
      for (const file of files) {
        const filePath = path.isAbsolute(file) 
          ? file 
          : path.join(this.workspaceRoot, file);

        if (!fs.existsSync(filePath)) {
          continue;
        }

        // Run prettier --check on the file
        try {
          execSync(`npx prettier --check "${filePath}"`, {
            cwd: this.workspaceRoot,
            stdio: 'pipe',
            encoding: 'utf-8',
          });
        } catch (error: any) {
          // Prettier exits with code 1 if file is not formatted
          violations.push({
            type: this.type,
            message: 'File is not formatted according to Prettier rules',
            file: path.relative(this.workspaceRoot, filePath),
            severity: 'minor' as const,
            details: 'Run `npx prettier --write` to format this file',
          });
        }
      }

      return {
        passed: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.7,
        violations,
        validatorType: this.type,
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        violations: [],
        validatorType: this.type,
        error: `Prettier validation failed: ${error}`,
      };
    }
  }
}
