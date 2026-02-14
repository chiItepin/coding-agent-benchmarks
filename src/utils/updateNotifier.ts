import chalk from "chalk";
import { UpdateInfo } from "./updateChecker";

const BOX_WIDTH = 49;

const pad = (text: string, width: number): string => {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, "").length;
  const padding = Math.max(0, width - visibleLength);
  return text + " ".repeat(padding);
};

export const notifyUpdate = (info: UpdateInfo): void => {
  if (!info.updateAvailable) {
    return;
  }

  const innerWidth = BOX_WIDTH - 2;
  const contentWidth = innerWidth - 6; // 3 spaces padding on each side

  const versionLine = `Update available: ${chalk.red(info.current)} → ${chalk.green(info.latest)}`;
  const installLine = `Run ${chalk.cyan("npm i -g coding-agent-benchmarks")}`;

  const top = chalk.yellow(`╭${"─".repeat(innerWidth)}╮`);
  const bottom = chalk.yellow(`╰${"─".repeat(innerWidth)}╯`);
  const emptyLine = chalk.yellow("│") + " ".repeat(innerWidth) + chalk.yellow("│");
  const versionRow = chalk.yellow("│") + "   " + pad(versionLine, contentWidth) + "   " + chalk.yellow("│");
  const installRow = chalk.yellow("│") + "   " + pad(installLine, contentWidth) + "   " + chalk.yellow("│");

  const box = [
    "",
    top,
    emptyLine,
    versionRow,
    installRow,
    emptyLine,
    bottom,
  ].join("\n");

  process.stderr.write(box + "\n");
};
