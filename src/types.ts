/**
 * Core type definitions for coding-agent-benchmarks
 */

/**
 * Generic categories for test scenarios
 */
export type TestCategory = 'typescript' | 'react' | 'testing' | 'architecture' | 'performance' | 'general';

/**
 * Severity levels for test scenarios
 */
export type Severity = 'critical' | 'major' | 'minor';

/**
 * Supported adapter types
 */
export type AdapterType = 'copilot' | 'claude-code';

/**
 * Pattern matching configuration for code validation
 */
export interface PatternValidation {
  /**
   * Regex patterns that should NOT appear in generated code
   */
  forbiddenPatterns?: readonly RegExp[];

  /**
   * Regex patterns that MUST appear in generated code
   */
  requiredPatterns?: readonly RegExp[];

  /**
   * Import statements that should NOT be present
   * Example: ['from "lodash"', 'import * as']
   */
  forbiddenImports?: readonly string[];

  /**
   * Import statements that MUST be present
   */
  requiredImports?: readonly string[];

  /**
   * File name patterns that should NOT be created
   */
  forbiddenFileNamePatterns?: readonly RegExp[];

  /**
   * File name patterns that MUST be created
   */
  requiredFileNamePatterns?: readonly RegExp[];
}

/**
 * LLM-as-judge validation configuration
 */
export interface LLMJudgeValidation {
  /**
   * Enable LLM-based semantic validation
   */
  enabled: boolean;

  /**
   * Custom prompt for the LLM judge
   * If not provided, a default judgment prompt will be used
   */
  judgmentPrompt?: string;

  /**
   * Model to use for judgment (default: openai/gpt-4.1)
   */
  model?: string;
}

/**
 * ESLint validation configuration
 */
export interface ESLintValidation {
  /**
   * Enable ESLint validation on generated code
   */
  enabled: boolean;

  /**
   * Custom ESLint config path (optional)
   */
  configPath?: string;
}

/**
 * Validation strategy combining multiple validation methods
 */
export interface ValidationStrategy {
  /**
   * Pattern-based validation
   */
  patterns?: PatternValidation;

  /**
   * LLM-as-judge validation
   */
  llmJudge?: LLMJudgeValidation;

  /**
   * ESLint validation
   */
  eslint?: ESLintValidation;
}

/**
 * A test scenario defining a coding task and validation criteria
 */
export interface TestScenario {
  /**
   * Unique identifier for the scenario
   */
  id: string;

  /**
   * Category of the test
   */
  category: TestCategory;

  /**
   * Severity level of violations
   */
  severity: Severity;

  /**
   * Tags for filtering and organization
   */
  tags: readonly string[];

  /**
   * Human-readable description of what this scenario tests
   */
  description: string;

  /**
   * The prompt/instruction given to the coding agent
   */
  prompt: string;

  /**
   * Optional inline context to include with the prompt
   */
  context?: string;

  /**
   * Optional context files to provide to the agent
   * Paths are resolved relative to the workspace root
   */
  contextFiles?: readonly string[];

  /**
   * Validation strategy to apply to generated code
   */
  validationStrategy: ValidationStrategy;

  /**
   * Optional timeout in milliseconds
   * - number: Specific timeout (e.g., 120000 = 2 minutes)
   * - null: No timeout (wait indefinitely)
   * - undefined: Use defaultTimeout from config, or 120000ms default
   */
  timeout?: number | null;
}

/**
 * A violation found during validation
 */
export interface Violation {
  /**
   * Type of validation that found this violation
   */
  type: 'pattern' | 'llm-judge' | 'eslint';

  /**
   * Description of the violation
   */
  message: string;

  /**
   * File where the violation was found (if applicable)
   */
  file?: string;

  /**
   * Line number where the violation was found (if applicable)
   */
  line?: number;

  /**
   * Severity of the violation
   */
  severity: Severity;

  /**
   * Additional details about the violation
   */
  details?: string;
}

/**
 * Result of a single validation
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  passed: boolean;

  /**
   * Score from 0.0 to 1.0 (1.0 = perfect, 0.0 = failed)
   * -1 = validation was skipped
   */
  score: number;

  /**
   * List of violations found
   */
  violations: Violation[];

  /**
   * Type of validator that produced this result
   */
  validatorType: 'pattern' | 'llm-judge' | 'eslint';

  /**
   * Error message if the validator itself failed
   */
  error?: string;
}

/**
 * Result of evaluating a single scenario
 */
export interface EvaluationResult {
  /**
   * The scenario that was evaluated
   */
  scenario: TestScenario;

  /**
   * Whether the scenario passed overall
   */
  passed: boolean;

  /**
   * Overall score (average of all validator scores)
   */
  score: number;

  /**
   * Results from each validator
   */
  validationResults: ValidationResult[];

  /**
   * All violations found across all validators
   */
  violations: Violation[];

  /**
   * Generated code (if available)
   */
  generatedCode?: {
    files: {
      path: string;
      content: string;
    }[];
  };

  /**
   * Time taken to evaluate (milliseconds)
   */
  duration: number;

  /**
   * Error message if evaluation failed
   */
  error?: string;

  /**
   * Baseline comparison (if available)
   */
  baselineComparison?: {
    baselineScore: number;
    delta: number;
    isImprovement: boolean;
  };
}

/**
 * Full evaluation report for multiple scenarios
 */
export interface EvaluationReport {
  /**
   * Adapter used for code generation
   */
  adapter: AdapterType;

  /**
   * Model used (if applicable)
   */
  model?: string;

  /**
   * Timestamp when evaluation started
   */
  timestamp: string;

  /**
   * Results for each scenario
   */
  results: EvaluationResult[];

  /**
   * Summary statistics
   */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    averageScore: number;
    totalViolations: number;
  };

  /**
   * Total duration of all evaluations (milliseconds)
   */
  totalDuration: number;
}

/**
 * Interface for code generation adapters
 */
export interface CodeGenerationAdapter {
  /**
   * Type identifier for this adapter
   */
  type: AdapterType;

  /**
   * Check if the adapter's CLI tool is available
   */
  checkAvailability(): Promise<boolean>;

  /**
   * Generate code based on a prompt
   * @param prompt The instruction/prompt for the coding agent
   * @param contextFiles Optional context files to provide
   * @param timeout Timeout in milliseconds, or null for no timeout (default: null = no timeout)
   * @returns List of files that were created or modified
   */
  generate(
    prompt: string,
    contextFiles?: readonly string[],
    timeout?: number | null
  ): Promise<string[]>;
}

/**
 * Interface for code validators
 */
export interface CodeValidator {
  /**
   * Type identifier for this validator
   */
  type: 'pattern' | 'llm-judge' | 'eslint';

  /**
   * Validate generated code
   * @param files List of file paths that were generated
   * @param scenario The test scenario being evaluated
   * @returns Validation result
   */
  validate(
    files: readonly string[],
    scenario: TestScenario
  ): Promise<ValidationResult>;
}

/**
 * Configuration file structure
 */
export interface BenchmarkConfig {
  /**
   * Custom test scenarios
   */
  scenarios?: TestScenario[];

  /**
   * Default adapter to use
   */
  defaultAdapter?: AdapterType;

  /**
   * Default LLM model for judge
   */
  defaultModel?: string;

  /**
   * Workspace root directory (auto-detected if not specified)
   */
  workspaceRoot?: string;

  /**
   * Default timeout for code generation in milliseconds
   * Applies to all scenarios unless overridden per-scenario
   * - number: Specific timeout (e.g., 120000 = 2 minutes)
   * - null: No timeout (wait indefinitely)
   * - undefined: Use built-in default of 120000ms
   */
  defaultTimeout?: number | null;

  /**
   * Output directory for reports
   */
  outputDir?: string;
}
