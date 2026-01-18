/**
 * Pattern-based code validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeValidator, TestScenario, ValidationResult, Violation } from '../types';
import { resolveFilePaths, resolveWorkspaceRoot } from '../utils/workspaceUtils';

export class PatternValidator implements CodeValidator {
  public readonly type = 'pattern' as const;
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = resolveWorkspaceRoot(workspaceRoot);
  }

  /**
   * Validate generated code against pattern rules
   */
  async validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult> {
    const patterns = scenario.validationStrategy.patterns;

    // If no pattern validation configured, skip
    if (!patterns) {
      return {
        passed: true,
        score: -1,
        violations: [],
        validatorType: 'pattern',
      };
    }

    const violations: Violation[] = [];
    const absolutePaths = resolveFilePaths(this.workspaceRoot, files);

    // Validate each file
    for (const filePath of absolutePaths) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(this.workspaceRoot, filePath);
        const fileName = path.basename(filePath);

        // Check forbidden patterns
        if (patterns.forbiddenPatterns) {
          for (const pattern of patterns.forbiddenPatterns) {
            const matches = this.findPatternMatches(content, pattern);
            for (const match of matches) {
              violations.push({
                type: 'pattern',
                message: `Forbidden pattern found: ${pattern.source}`,
                file: relativePath,
                line: match.line,
                severity: scenario.severity,
                details: `Matched: "${match.text}"`,
              });
            }
          }
        }

        // Check required patterns
        if (patterns.requiredPatterns) {
          for (const pattern of patterns.requiredPatterns) {
            if (!pattern.test(content)) {
              violations.push({
                type: 'pattern',
                message: `Required pattern not found: ${pattern.source}`,
                file: relativePath,
                severity: scenario.severity,
              });
            }
          }
        }

        // Check forbidden imports
        if (patterns.forbiddenImports) {
          for (const importPattern of patterns.forbiddenImports) {
            if (content.includes(importPattern)) {
              const lineInfo = this.findLineWithText(content, importPattern);
              violations.push({
                type: 'pattern',
                message: `Forbidden import found: ${importPattern}`,
                file: relativePath,
                line: lineInfo?.line,
                severity: scenario.severity,
                details: lineInfo ? `Line: "${lineInfo.text}"` : undefined,
              });
            }
          }
        }

        // Check required imports
        if (patterns.requiredImports) {
          for (const importPattern of patterns.requiredImports) {
            if (!content.includes(importPattern)) {
              violations.push({
                type: 'pattern',
                message: `Required import not found: ${importPattern}`,
                file: relativePath,
                severity: scenario.severity,
              });
            }
          }
        }

        // Check forbidden file name patterns
        if (patterns.forbiddenFileNamePatterns) {
          for (const pattern of patterns.forbiddenFileNamePatterns) {
            if (pattern.test(fileName)) {
              violations.push({
                type: 'pattern',
                message: `Forbidden file name pattern: ${pattern.source}`,
                file: relativePath,
                severity: scenario.severity,
                details: `File name: "${fileName}"`,
              });
            }
          }
        }

        // Check required file name patterns
        if (patterns.requiredFileNamePatterns) {
          const hasRequiredFile = absolutePaths.some(p =>
            patterns.requiredFileNamePatterns!.some(pattern =>
              pattern.test(path.basename(p))
            )
          );
          if (!hasRequiredFile) {
            violations.push({
              type: 'pattern',
              message: `Required file name pattern not found: ${patterns.requiredFileNamePatterns.map(p => p.source).join(', ')}`,
              severity: scenario.severity,
            });
          }
        }
      } catch (error) {
        return {
          passed: false,
          score: 0,
          violations: [],
          validatorType: 'pattern',
          error: `Failed to read file ${filePath}: ${error}`,
        };
      }
    }

    // Calculate score based on violations
    const passed = violations.length === 0;
    const score = this.calculateScore(violations);

    return {
      passed,
      score,
      violations,
      validatorType: 'pattern',
    };
  }

  /**
   * Find all matches of a pattern in text with line numbers
   */
  private findPatternMatches(
    text: string,
    pattern: RegExp
  ): Array<{ line: number; text: string }> {
    const lines = text.split('\n');
    const matches: Array<{ line: number; text: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.test(line)) {
        matches.push({
          line: i + 1,
          text: line.trim(),
        });
      }
    }

    return matches;
  }

  /**
   * Find the line number containing specific text
   */
  private findLineWithText(
    text: string,
    searchText: string
  ): { line: number; text: string } | null {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return {
          line: i + 1,
          text: lines[i].trim(),
        };
      }
    }
    return null;
  }

  /**
   * Calculate score based on number and severity of violations
   * Critical violations have more weight than minor ones
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
    // Using exponential decay: score = e^(-totalWeight)
    const score = Math.exp(-totalWeight);

    return Math.max(0, Math.min(1, score));
  }
}
