/**
 * Error handling and formatting utilities
 */

import chalk from "chalk";
import { AdapterType } from "../types";

/**
 * Format and display error messages with appropriate styling
 */
export const processCLIError = (
  error: unknown,
  context?: { adapter?: string },
): void => {
  const errorMessage = String(error);
  const isInteractive = process.stdout.isTTY === true;

  // Unknown adapter type error
  if (errorMessage.includes("Unknown adapter type")) {
    displayUnknownAdapterError(context?.adapter, isInteractive);
    return;
  }

  // Generic error
  if (isInteractive) {
    console.error(chalk.red("Error:"), errorMessage);
  } else {
    console.error("Error:", errorMessage);
  }
};

/**
 * Display a formatted error message for unknown adapter types
 */
const displayUnknownAdapterError = (
  providedAdapter?: string,
  isInteractive = true,
): void => {
  const validAdapters: AdapterType[] = ["copilot", "claude-code"];

  if (isInteractive) {
    console.error("");
    console.error(chalk.red.bold("\u2717 Invalid adapter type"));
    console.error("");

    if (providedAdapter) {
      console.error(
        `  ${chalk.gray("You specified:")} ${chalk.yellow(providedAdapter)}`,
      );
    }

    console.error(
      `  ${chalk.gray("Valid options:")} ${validAdapters.map((a) => chalk.green(a)).join(", ")}`,
    );
    console.error("");
    console.error(
      chalk.gray(
        "  Example: npx coding-agent-benchmarks evaluate --adapter claude-code",
      ),
    );
    console.error("");
  } else {
    // Non-interactive mode: simple, parseable output
    console.error("Error: Invalid adapter type");
    if (providedAdapter) {
      console.error(`  You specified: ${providedAdapter}`);
    }
    console.error(`  Valid options: ${validAdapters.join(", ")}`);
    console.error(
      "  Example: npx coding-agent-benchmarks evaluate --adapter copilot",
    );
  }
};
