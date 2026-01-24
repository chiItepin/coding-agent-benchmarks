import chalk from "chalk";
import logUpdate from "log-update";
import {
  TestScenario,
  EvaluationResult,
  EvaluationReport,
  Violation,
} from "./types";

export type ExecutionPhase =
  | "pending"
  | "generating"
  | "validating"
  | "complete";

export type ScenarioStatus = "runs" | "pass" | "fail" | "skip";

interface ScenarioState {
  scenario: TestScenario;
  phase: ExecutionPhase;
  status: ScenarioStatus;
  startTime?: number;
  result?: EvaluationResult;
  model?: string;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class ProgressReporter {
  private isInteractive: boolean;
  private verbose: boolean;
  private scenarios: Map<string, ScenarioState> = new Map();
  private scenarioOrder: string[] = [];
  private currentIndex: number = 0;
  private totalScenarios: number = 0;
  private spinnerFrame: number = 0;
  private spinnerInterval?: ReturnType<typeof setInterval>;
  private startTime: number = 0;
  private verboseBuffer: string[] = [];
  private saveBaseline: boolean;
  private compareBaseline: boolean;
  private adapter: string;

  constructor(
    options: {
      verbose?: boolean;
      saveBaseline?: boolean;
      compareBaseline?: boolean;
      adapter?: string;
    } = {},
  ) {
    this.isInteractive = process.stdout.isTTY === true;
    this.verbose = options.verbose ?? false;
    this.saveBaseline = options.saveBaseline ?? false;
    this.compareBaseline = options.compareBaseline ?? false;
    this.adapter = options.adapter ?? "unknown";
  }

  start(scenarios: TestScenario[]): void {
    this.startTime = Date.now();
    this.totalScenarios = scenarios.length;
    this.scenarioOrder = scenarios.map((s) => s.id);
    this.currentIndex = 0;

    for (const scenario of scenarios) {
      this.scenarios.set(scenario.id, {
        scenario,
        phase: "pending",
        status: "runs",
      });
    }

    if (this.isInteractive) {
      console.log(`\nEvaluating ${scenarios.length} scenario(s)...\n`);
      this.startSpinner();
    } else {
      console.log(`Evaluating ${scenarios.length} scenario(s)...`);
    }
  }

  onScenarioStart(scenarioId: string): void {
    const state = this.scenarios.get(scenarioId);
    if (!state) return;

    state.phase = "generating";
    state.status = "runs";
    state.startTime = Date.now();

    if (this.isInteractive) {
      this.render();
    } else {
      console.log(
        `\n[${this.getScenarioIndex(scenarioId)}/${this.totalScenarios}] ${scenarioId}`,
      );
      if (this.verbose) {
        console.log(`  Generating code...`);
      }
    }
  }

  onScenarioValidating(scenarioId: string): void {
    const state = this.scenarios.get(scenarioId);
    if (!state) return;

    state.phase = "validating";

    if (this.isInteractive) {
      this.render();
    } else if (this.verbose) {
      console.log(`  Validating...`);
    }
  }

  onScenarioComplete(
    scenarioId: string,
    result: EvaluationResult,
    model: string,
  ): void {
    const state = this.scenarios.get(scenarioId);
    if (!state) return;

    state.phase = "complete";
    state.result = result;
    state.status = result.error ? "skip" : result.passed ? "pass" : "fail";
    state.model = model;

    if (this.isInteractive) {
      this.render();
    } else {
      this.printScenarioResult(scenarioId, result, model);
    }

    this.flushVerboseBuffer();
  }

  log(message: string): void {
    if (this.isInteractive) {
      this.verboseBuffer.push(message);
    } else {
      console.log(message);
    }
  }

  finish(report: EvaluationReport): void {
    this.stopSpinner();

    if (this.isInteractive) {
      logUpdate.done();
    }

    this.printSummary(report);
  }

  private getScenarioIndex(scenarioId: string): number {
    return this.scenarioOrder.indexOf(scenarioId) + 1;
  }

  private startSpinner(): void {
    if (!this.isInteractive) return;

    this.spinnerInterval = setInterval(() => {
      this.spinnerFrame = (this.spinnerFrame + 1) % SPINNER_FRAMES.length;
      this.render();
    }, 80);
  }

  private stopSpinner(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
    }
  }

  private render(): void {
    if (!this.isInteractive) return;

    const lines: string[] = [];

    for (const scenarioId of this.scenarioOrder) {
      const state = this.scenarios.get(scenarioId);
      if (!state) continue;

      const line = this.formatScenarioLine(state);
      lines.push(line);
    }

    logUpdate(lines.join("\n"));
  }

  private formatScenarioLine(state: ScenarioState): string {
    const index = this.getScenarioIndex(state.scenario.id);
    const prefix = `[${index}/${this.totalScenarios}]`;

    let line: string;

    switch (state.status) {
      case "runs": {
        const spinner = SPINNER_FRAMES[this.spinnerFrame];
        const phaseText =
          state.phase === "generating" ? "generating..." : "validating...";
        const elapsed = state.startTime
          ? this.formatDuration(Date.now() - state.startTime)
          : "";
        line = `${chalk.yellow(spinner)} ${prefix} ${state.scenario.id} ${chalk.dim(phaseText)} ${chalk.dim(elapsed)}`;
        break;
      }
      case "pass": {
        const score = state.result?.score.toFixed(2) ?? "0.00";
        const duration = state.result
          ? this.formatDuration(state.result.duration)
          : "";
        line = `${chalk.green("✓")} ${prefix} ${state.scenario.id} ${chalk.green("PASS")} ${chalk.dim(`(score: ${score})`)} ${chalk.dim(duration)}`;
        break;
      }
      case "fail": {
        const score = state.result?.score.toFixed(2) ?? "0.00";
        const duration = state.result
          ? this.formatDuration(state.result.duration)
          : "";
        line = `${chalk.red("✗")} ${prefix} ${state.scenario.id} ${chalk.red("FAIL")} ${chalk.dim(`(score: ${score})`)} ${chalk.dim(duration)}`;
        break;
      }
      case "skip": {
        line = `${chalk.yellow("○")} ${prefix} ${state.scenario.id} ${chalk.yellow("SKIP")} ${chalk.dim("(error)")}`;
        break;
      }
    }

    if (state.phase === "complete" && state.result) {
      const baselineLines: string[] = [];

      if (this.compareBaseline && state.result.baselineComparison) {
        baselineLines.push(
          this.formatBaselineComparison(state.result.baselineComparison),
        );
      }

      if (this.saveBaseline && state.model) {
        baselineLines.push(this.formatBaselineSave(state.model));
      }

      if (baselineLines.length > 0) {
        return line + "\n" + baselineLines.join("\n");
      }
    }

    return line;
  }

  private printScenarioResult(
    scenarioId: string,
    result: EvaluationResult,
    model: string,
  ): void {
    if (result.error) {
      console.log(`  ○ SKIP (error)`);
      this.printViolations(result.violations);
      console.log(`    Error: ${result.error}`);
    } else if (result.passed) {
      console.log(`  ✓ PASSED (score: ${result.score.toFixed(2)})`);
    } else {
      console.log(`  ✗ FAILED (score: ${result.score.toFixed(2)})`);
      this.printViolations(result.violations);
    }

    if (this.compareBaseline && result.baselineComparison) {
      console.log(this.formatBaselineComparison(result.baselineComparison));
    }
    if (this.saveBaseline) {
      console.log(this.formatBaselineSave(model));
    }
  }

  private printViolations(violations: Violation[]): void {
    if (violations.length === 0) return;

    console.log(`    ${violations.length} violation(s):\n`);
    violations.forEach((v, idx) => {
      console.log(`    ${idx + 1}. [${v.type}] ${v.message}`);
      if (v.file) {
        console.log(`       File: ${v.file}${v.line ? `:${v.line}` : ""}`);
      }
      if (v.details) {
        console.log(`       Details: ${v.details}`);
      }
    });
  }

  private flushVerboseBuffer(): void {
    if (!this.isInteractive || this.verboseBuffer.length === 0) return;

    logUpdate.clear();

    this.verboseBuffer.forEach((message) => console.log(message));
    this.verboseBuffer = [];

    this.render();
  }

  private printSummary(report: EvaluationReport): void {
    const { summary, totalDuration } = report;

    if (this.isInteractive) {
      report.results.forEach((result) => {
        if (!result.passed && !result.error) {
          console.log(`\n${chalk.red("✗")} ${result.scenario.id}`);
          this.printViolations(result.violations);
        }
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("EVALUATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total scenarios: ${summary.total}`);
    console.log(
      `Passed: ${this.isInteractive ? chalk.green(summary.passed.toString()) : summary.passed}`,
    );
    console.log(
      `Failed: ${this.isInteractive ? chalk.red(summary.failed.toString()) : summary.failed}`,
    );
    console.log(
      `Skipped: ${this.isInteractive ? chalk.yellow(summary.skipped.toString()) : summary.skipped}`,
    );
    console.log(`Average score: ${summary.averageScore.toFixed(2)}`);
    console.log(`Total violations: ${summary.totalViolations}`);
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log("=".repeat(60));
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }

  private formatBaselineComparison(comparison: {
    baselineScore: number;
    delta: number;
    isImprovement: boolean;
  }): string {
    if (comparison.baselineScore === 0) {
      const sign = comparison.delta >= 0 ? "+" : "";
      const arrow =
        comparison.delta >= 0
          ? this.isInteractive
            ? chalk.green("↑")
            : "↑"
          : this.isInteractive
            ? chalk.red("↓")
            : "↓";

      let text = `${sign}${comparison.delta.toFixed(2)} from baseline (0.00)`;
      if (this.isInteractive) {
        if (comparison.delta >= 0) {
          text = chalk.green(text);
        } else if (comparison.delta < 0) {
          text = chalk.red(text);
        } else {
          text = chalk.yellow(text);
        }
      }
      return `    ${arrow} ${text}`;
    }

    const percentage = (comparison.delta / comparison.baselineScore) * 100;
    const percentStr = Math.abs(percentage).toFixed(1);

    if (comparison.isImprovement) {
      const arrow = this.isInteractive ? chalk.green("↑") : "↑";
      const text = this.isInteractive
        ? chalk.green(`+${percentStr}% improvement from baseline`)
        : `+${percentStr}% improvement from baseline`;
      return `    ${arrow} ${text}`;
    } else {
      if (percentage === 0) {
        const dash = this.isInteractive ? chalk.yellow("–") : "–";
        const text = this.isInteractive
          ? chalk.yellow(`0.0% change from baseline`)
          : `0.0% change from baseline`;
        return `    ${dash} ${text}`;
      }

      const arrow = this.isInteractive ? chalk.red("↓") : "↓";
      const text = this.isInteractive
        ? chalk.red(`-${percentStr}% regression from baseline`)
        : `-${percentStr}% regression from baseline`;
      return `    ${arrow} ${text}`;
    }
  }

  private formatBaselineSave(model: string): string {
    const path = `${this.adapter}/${model}`;
    return `    → Baseline saved (${path})`;
  }
}
