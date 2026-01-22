#!/usr/bin/env node

/**
 * CLI interface for coding-agent-benchmarks
 */

import { Command } from "commander";
import * as fs from "fs";
import { loadConfig } from "./config/loader";
import { Evaluator } from "./evaluator";
import { AdapterType } from "./types";
import { CopilotCLIAdapter } from "./adapters/copilotCLI";
import { ClaudeCodeCLIAdapter } from "./adapters/claudeCodeCLI";
import { LLMJudgeValidator } from "./validators/llmJudge";
import { checkGitHubAuth } from "./utils/githubAuth";
import { ProgressReporter } from "./reporter";

const program = new Command();

program
  .name("coding-agent-benchmarks")
  .description(
    "Evaluate coding agents against coding standards and best practices",
  )
  .version("0.1.0");

/**
 * Evaluate command
 */
program
  .command("evaluate")
  .description("Run benchmark evaluations")
  .option(
    "--scenario <pattern>",
    "Filter scenarios by ID pattern (supports wildcards)",
  )
  .option("--category <categories>", "Filter by category (comma-separated)")
  .option("--tag <tags>", "Filter by tags (comma-separated)")
  .option(
    "--adapter <type>",
    "Code generation adapter (copilot or claude-code)",
    "copilot",
  )
  .option("--model <model>", "LLM model for judge (default: openai/gpt-4.1)")
  .option("--threshold <number>", "Minimum passing score", "0.8")
  .option("--verbose", "Show detailed output")
  .option("--output <file>", "Export JSON report to file")
  .option("--save-baseline", "Save results as baseline")
  .option("--compare-baseline", "Compare results with baseline")
  .option("--workspace-root <path>", "Workspace root directory")
  .action(async (options) => {
    try {
      const { config, scenarios } = await loadConfig(
        options.workspaceRoot || process.cwd(),
      );

      const evaluator = new Evaluator({
        adapter: options.adapter as AdapterType,
        model: options.model,
        workspaceRoot: options.workspaceRoot,
        defaultTimeout: config.defaultTimeout,
        verbose: options.verbose,
        saveBaseline: options.saveBaseline,
        compareBaseline: options.compareBaseline,
      });

      const reporter = new ProgressReporter({ verbose: options.verbose });

      evaluator.on("evaluation:start", (scenarioList) => {
        reporter.start(scenarioList);
      });

      evaluator.on("scenario:start", (scenarioId) => {
        reporter.onScenarioStart(scenarioId);
      });

      evaluator.on("scenario:generating", (scenarioId) => {
        // Phase already set in onScenarioStart, but could be used for more granular updates
      });

      evaluator.on("scenario:validating", (scenarioId) => {
        reporter.onScenarioValidating(scenarioId);
      });

      evaluator.on("scenario:complete", (scenarioId, result) => {
        reporter.onScenarioComplete(scenarioId, result);
      });

      evaluator.on("log", (message) => {
        reporter.log(message);
      });

      // Check adapter availability
      const isAvailable = await evaluator.checkAdapterAvailability();
      if (!isAvailable) {
        console.error(`Error: ${options.adapter} CLI not found`);
        console.error(
          `Please install ${options.adapter} CLI to use this adapter`,
        );
        process.exit(1);
      }

      // Filter scenarios
      const filteredScenarios = evaluator.filterScenarios(scenarios, {
        scenarioPattern: options.scenario,
        category: options.category,
        tags: options.tag
          ? options.tag.split(",").map((t: string) => t.trim())
          : undefined,
      });

      if (filteredScenarios.length === 0) {
        console.log("No scenarios match the specified filters");
        return;
      }

      // Run evaluation
      const report = await evaluator.evaluate(filteredScenarios);

      // Finish reporter and display summary
      reporter.finish(report);

      // Export JSON report if requested
      if (options.output) {
        fs.writeFileSync(
          options.output,
          JSON.stringify(report, null, 2),
          "utf-8",
        );
        console.log(`\nReport exported to: ${options.output}`);
      }

      // Exit with error code if any scenarios failed
      if (report.summary.failed > 0 || report.summary.skipped > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

/**
 * List command
 */
program
  .command("list")
  .description("List available test scenarios")
  .option("--category <categories>", "Filter by category")
  .option("--tag <tags>", "Filter by tags (comma-separated)")
  .action(async (options) => {
    try {
      const { scenarios } = await loadConfig();

      let filtered = scenarios;

      // Filter by category
      if (options.category) {
        const categories = options.category
          .split(",")
          .map((c: string) => c.trim());
        filtered = filtered.filter((s) => categories.includes(s.category));
      }

      // Filter by tags
      if (options.tag) {
        const tags = options.tag.split(",").map((t: string) => t.trim());
        filtered = filtered.filter((s) =>
          tags.some((tag: string) => s.tags.includes(tag)),
        );
      }

      console.log(`\nAvailable scenarios (${filtered.length}):\n`);

      for (const scenario of filtered) {
        console.log(`  ${scenario.id}`);
        console.log(`    Category: ${scenario.category}`);
        console.log(`    Severity: ${scenario.severity}`);
        console.log(`    Tags: ${scenario.tags.join(", ")}`);
        console.log(`    Description: ${scenario.description}`);
        console.log();
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

/**
 * Check command
 */
program
  .command("check")
  .description("Check if coding agent CLIs and GitHub auth are available")
  .action(async () => {
    console.log("Checking adapter availability...\n");

    const adapters: Array<{ name: string; type: AdapterType }> = [
      { name: "GitHub Copilot CLI", type: "copilot" },
      { name: "Claude Code CLI", type: "claude-code" },
    ];

    for (const { name, type } of adapters) {
      let adapter;
      if (type === "copilot") {
        adapter = new CopilotCLIAdapter();
      } else {
        adapter = new ClaudeCodeCLIAdapter();
      }

      const available = await adapter.checkAvailability();
      const status = available ? "✓ Available" : "✗ Not found";
      console.log(`  ${name}: ${status}`);
    }

    console.log("\nChecking GitHub authentication...\n");
    const authStatus = checkGitHubAuth();
    const authIcon = authStatus.available ? "✓" : "✗";
    console.log(`  ${authIcon} ${authStatus.message}`);

    if (!authStatus.available) {
      console.log(
        "\n  💡 GitHub token is required for LLM-as-judge validation",
      );
      console.log(
        "  Setup: https://github.com/settings/tokens (scope: models:read)",
      );
      console.log("  Or install GitHub CLI: brew install gh && gh auth login");
    }

    console.log();
  });

/**
 * Test LLM command
 */
program
  .command("test-llm")
  .description("Test LLM judge with a custom prompt")
  .option("--model <model>", "LLM model to use (default: openai/gpt-4.1)")
  .action(async (options) => {
    try {
      console.log("Testing LLM judge...\n");
      console.log("Enter your prompt (Ctrl+D when done):\n");

      // Read prompt from stdin
      const chunks: string[] = [];
      process.stdin.on("data", (chunk) => {
        chunks.push(chunk.toString());
      });

      process.stdin.on("end", async () => {
        const prompt = chunks.join("");

        const validator = new LLMJudgeValidator(undefined, options.model);
        const result = await validator.testJudge(prompt, options.model);

        console.log("\nLLM Response:\n");
        console.log(result);
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);
