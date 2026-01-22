/**
 * Main evaluation engine
 */

import { EventEmitter } from "events";
import {
  AdapterType,
  CodeGenerationAdapter,
  TestScenario,
  EvaluationResult,
  EvaluationReport,
  ValidationResult,
} from "./types";
import { CopilotCLIAdapter } from "./adapters/copilotCLI";
import { ClaudeCodeCLIAdapter } from "./adapters/claudeCodeCLI";
import { PatternValidator } from "./validators/patternValidator";
import { LLMJudgeValidator } from "./validators/llmJudge";
import { ESLintValidator } from "./validators/eslintValidator";
import { resolveWorkspaceRoot } from "./utils/workspaceUtils";
import { BaselineManager } from "./utils/baselineManager";

/**
 * Events emitted by the Evaluator during execution
 */
export interface EvaluatorEvents {
  "evaluation:start": (scenarios: TestScenario[]) => void;
  "scenario:start": (scenarioId: string, scenario: TestScenario) => void;
  "scenario:generating": (scenarioId: string) => void;
  "scenario:validating": (scenarioId: string) => void;
  "scenario:complete": (scenarioId: string, result: EvaluationResult) => void;
  "evaluation:complete": (report: EvaluationReport) => void;
  log: (message: string) => void;
}

export interface EvaluatorOptions {
  adapter: AdapterType;
  model?: string;
  workspaceRoot?: string;
  defaultTimeout?: number | null;
  verbose?: boolean;
  saveBaseline?: boolean;
  compareBaseline?: boolean;
}

export class Evaluator extends EventEmitter {
  private adapter: CodeGenerationAdapter;
  private workspaceRoot: string;
  private baselineManager: BaselineManager;
  private options: EvaluatorOptions;

  constructor(options: EvaluatorOptions) {
    super();
    this.options = options;
    this.workspaceRoot = resolveWorkspaceRoot(options.workspaceRoot);
    this.baselineManager = new BaselineManager(this.workspaceRoot);

    // Create adapter based on type
    this.adapter = this.createAdapter(options.adapter);
  }

  /**
   * Type-safe event emitter methods
   */
  override on<K extends keyof EvaluatorEvents>(
    event: K,
    listener: EvaluatorEvents[K],
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof EvaluatorEvents>(
    event: K,
    ...args: Parameters<EvaluatorEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Create adapter instance based on type
   */
  private createAdapter(type: AdapterType): CodeGenerationAdapter {
    switch (type) {
      case "copilot":
        return new CopilotCLIAdapter({
          workspaceRoot: this.workspaceRoot,
          model: this.options.model,
        });
      case "claude-code":
        return new ClaudeCodeCLIAdapter({
          workspaceRoot: this.workspaceRoot,
          model: this.options.model,
        });
      default:
        throw new Error(`Unknown adapter type: ${type}`);
    }
  }

  /**
   * Check if adapter is available
   */
  async checkAdapterAvailability(): Promise<boolean> {
    return this.adapter.checkAvailability();
  }

  /**
   * Filter scenarios based on criteria
   */
  filterScenarios(
    scenarios: TestScenario[],
    filters: {
      scenarioPattern?: string;
      category?: string;
      tags?: string[];
    },
  ): TestScenario[] {
    let filtered = scenarios;

    // Filter by scenario ID pattern
    if (filters.scenarioPattern) {
      const pattern = filters.scenarioPattern.replace(/\*/g, ".*");
      const regex = new RegExp(pattern);
      filtered = filtered.filter((s) => regex.test(s.id));
    }

    // Filter by category
    if (filters.category) {
      const categories = filters.category.split(",").map((c) => c.trim());
      filtered = filtered.filter((s) => categories.includes(s.category));
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((s) =>
        filters.tags!.some((tag) => s.tags.includes(tag)),
      );
    }

    return filtered;
  }

  /**
   * Evaluate a single scenario
   */
  async evaluateScenario(scenario: TestScenario): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      if (this.options.verbose) {
        this.emit("log", `\nEvaluating scenario: ${scenario.id}`);
        this.emit("log", `  Description: ${scenario.description}`);
      }

      // Emit generating phase
      this.emit("scenario:generating", scenario.id);

      if (this.options.verbose) {
        this.emit("log", "  Generating code...");
      }

      // Resolve timeout (null = no timeout, undefined = use defaults)
      let timeout: number | null;
      if (scenario.timeout !== undefined) {
        // Scenario explicitly sets timeout (could be number or null)
        timeout = scenario.timeout;
      } else if (this.options.defaultTimeout !== undefined) {
        // Config sets default timeout (could be number or null)
        timeout = this.options.defaultTimeout;
      } else {
        // Built-in default: 2 minutes
        timeout = 120000;
      }

      const generatedFiles = await this.adapter.generate(
        scenario.prompt,
        scenario.contextFiles,
        timeout,
      );

      if (this.options.verbose) {
        this.emit("log", `  Generated ${generatedFiles.length} file(s)`);
      }

      // Emit validating phase
      this.emit("scenario:validating", scenario.id);

      // Run validators
      const validationResults: ValidationResult[] = [];

      // Pattern validator
      const patternValidator = new PatternValidator(this.workspaceRoot);
      const patternResult = await patternValidator.validate(
        generatedFiles,
        scenario,
      );
      validationResults.push(patternResult);

      if (this.options.verbose && patternResult.score >= 0) {
        this.emit(
          "log",
          `  Pattern validation: ${patternResult.score.toFixed(2)}`,
        );
      }

      // LLM judge validator
      const llmValidator = new LLMJudgeValidator(
        this.workspaceRoot,
        this.options.model,
      );
      const llmResult = await llmValidator.validate(generatedFiles, scenario);
      validationResults.push(llmResult);

      if (this.options.verbose && llmResult.score >= 0) {
        this.emit("log", `  LLM judge: ${llmResult.score.toFixed(2)}`);
      }

      // ESLint validator
      const eslintValidator = new ESLintValidator(this.workspaceRoot);
      const eslintResult = await eslintValidator.validate(
        generatedFiles,
        scenario,
      );
      validationResults.push(eslintResult);

      if (this.options.verbose && eslintResult.score >= 0) {
        this.emit("log", `  ESLint: ${eslintResult.score.toFixed(2)}`);
      }

      // Calculate overall score (average of non-skipped validators)
      const activeResults = validationResults.filter((r) => r.score >= 0);
      const overallScore =
        activeResults.length > 0
          ? activeResults.reduce((sum, r) => sum + r.score, 0) /
            activeResults.length
          : 0;

      // Collect all violations
      const allViolations = validationResults.flatMap((r) => r.violations);

      // Check if passed (score above threshold and no violations)
      const passed = overallScore >= 0.8 && allViolations.length === 0;

      const result: EvaluationResult = {
        scenario,
        passed,
        score: overallScore,
        validationResults,
        violations: allViolations,
        duration: Date.now() - startTime,
      };

      // Compare with baseline if requested
      if (this.options.compareBaseline) {
        const comparison = this.baselineManager.compareWithBaseline(
          result,
          this.options.adapter,
          this.options.model || "default",
        );
        if (comparison) {
          result.baselineComparison = comparison;
        }
      }

      // Save baseline if requested
      if (this.options.saveBaseline) {
        this.baselineManager.saveBaseline(
          result,
          this.options.adapter,
          this.options.model || "default",
        );
      }

      return result;
    } catch (error) {
      const errorMessage = String(error);
      const isTimeout = errorMessage.includes("timed out");

      // Create a violation for timeout errors
      const violations = isTimeout
        ? [
            {
              type: "pattern" as const,
              message: "Code generation timed out",
              severity: scenario.severity,
              details: errorMessage,
            },
          ]
        : [];

      return {
        scenario,
        passed: false,
        score: 0,
        validationResults: [],
        violations,
        duration: Date.now() - startTime,
        error: `Evaluation failed: ${error}`,
      };
    }
  }

  /**
   * Evaluate multiple scenarios
   */
  async evaluate(scenarios: TestScenario[]): Promise<EvaluationReport> {
    const startTime = Date.now();
    const results: EvaluationResult[] = [];

    // Emit evaluation start event
    this.emit("evaluation:start", scenarios);

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];

      // Emit scenario start event
      this.emit("scenario:start", scenario.id, scenario);

      const result = await this.evaluateScenario(scenario);
      results.push(result);

      // Emit scenario complete event
      this.emit("scenario:complete", scenario.id, result);
    }

    // Calculate summary statistics
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed && !r.error).length;
    const skipped = results.filter((r) => r.error).length;
    const totalViolations = results.reduce(
      (sum, r) => sum + r.violations.length,
      0,
    );
    const averageScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0;

    const report: EvaluationReport = {
      adapter: this.options.adapter,
      model: this.options.model,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: scenarios.length,
        passed,
        failed,
        skipped,
        averageScore,
        totalViolations,
      },
      totalDuration: Date.now() - startTime,
    };

    // Emit evaluation complete event
    this.emit("evaluation:complete", report);

    return report;
  }
}
