/**
 * ESLint validator for generated code
 */

import * as fs from "fs";
import * as path from "path";
import {
  CodeValidator,
  TestScenario,
  ValidationResult,
  Violation,
} from "../types";
import {
  resolveFilePaths,
  resolveWorkspaceRoot,
} from "../utils/workspaceUtils";
import { execSync } from "child_process";

export class ESLintValidator implements CodeValidator {
  public readonly type = "eslint" as const;
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = resolveWorkspaceRoot(workspaceRoot);
  }

  /**
   * Check if ESLint is available in the project
   */
  private async checkESLintAvailability(): Promise<boolean> {
    try {
      // Check if eslint is installed
      execSync("npx eslint --version", {
        cwd: this.workspaceRoot,
        stdio: "pipe",
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate generated code using ESLint
   */
  async validate(
    files: readonly string[],
    scenario: TestScenario,
  ): Promise<ValidationResult> {
    const eslintConfig = scenario.validationStrategy.eslint;

    // If ESLint not enabled, skip
    if (!eslintConfig?.enabled) {
      return {
        passed: true,
        score: -1, // skip
        violations: [],
        validatorType: "eslint",
      };
    }

    // Check if ESLint is available
    const isAvailable = await this.checkESLintAvailability();
    if (!isAvailable) {
      console.warn("ESLint not found in project, skipping ESLint validation");
      return {
        passed: true,
        score: -1,
        violations: [],
        validatorType: "eslint",
        error: "ESLint not found",
      };
    }

    try {
      const absolutePaths = resolveFilePaths(this.workspaceRoot, files);
      const violations: Violation[] = [];

      // Run ESLint on each file
      for (const filePath of absolutePaths) {
        if (!fs.existsSync(filePath)) {
          continue;
        }

        // Only lint JS/TS files
        const ext = path.extname(filePath).toLowerCase();
        if (![".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) {
          continue;
        }

        try {
          // Run ESLint with JSON output
          const configArg = eslintConfig.configPath
            ? `--config ${eslintConfig.configPath}`
            : "";

          const output = execSync(
            `npx eslint ${configArg} --format json "${filePath}"`,
            {
              cwd: this.workspaceRoot,
              encoding: "utf-8",
              stdio: "pipe",
            },
          );

          // Parse ESLint output
          const results = JSON.parse(output);
          const relativePath = path.relative(this.workspaceRoot, filePath);

          // Extract violations from ESLint results
          for (const result of results) {
            for (const message of result.messages || []) {
              const severity =
                message.severity === 2
                  ? "major"
                  : message.severity === 1
                    ? "minor"
                    : "minor";

              violations.push({
                type: "eslint",
                message: `${message.ruleId}: ${message.message}`,
                file: relativePath,
                line: message.line,
                severity: severity as "major" | "minor",
                details: `Column ${message.column}`,
              });
            }
          }
        } catch (error: any) {
          // ESLint exits with non-zero code if there are errors
          // Try to parse the error output
          if (error.stdout) {
            try {
              const results = JSON.parse(error.stdout);
              const relativePath = path.relative(this.workspaceRoot, filePath);

              for (const result of results) {
                for (const message of result.messages || []) {
                  const severity =
                    message.severity === 2
                      ? "major"
                      : message.severity === 1
                        ? "minor"
                        : "minor";

                  violations.push({
                    type: "eslint",
                    message: `${message.ruleId}: ${message.message}`,
                    file: relativePath,
                    line: message.line,
                    severity: severity as "major" | "minor",
                    details: `Column ${message.column}`,
                  });
                }
              }
            } catch {
              // If we can't parse the output, treat it as a general error
              violations.push({
                type: "eslint",
                message: `ESLint failed for ${path.basename(filePath)}`,
                file: path.relative(this.workspaceRoot, filePath),
                severity: scenario.severity,
                details: error.message,
              });
            }
          }
        }
      }

      // Calculate score based on violations
      const passed = violations.length === 0;
      const score = this.calculateScore(violations);

      return {
        passed,
        score,
        violations,
        validatorType: "eslint",
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        violations: [],
        validatorType: "eslint",
        error: `ESLint validation failed: ${error}`,
      };
    }
  }

  /**
   * Calculate score based on number and severity of violations
   */
  private calculateScore(violations: Violation[]): number {
    if (violations.length === 0) {
      return 1.0;
    }

    // Weight violations by severity
    const weights = {
      critical: 1.0,
      major: 0.7,
      minor: 0.3,
    };

    const totalWeight = violations.reduce((sum, v) => {
      return sum + weights[v.severity];
    }, 0);

    // Score decreases with more weighted violations
    // Using exponential decay: score = e^(-totalWeight/2)
    const score = Math.exp(-totalWeight / 2);

    return Math.max(0, Math.min(1, score));
  }
}
