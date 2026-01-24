/**
 * Claude Code CLI Adapter
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CodeGenerationAdapter } from '../types';
import { getChangedFilesDiff, getGitStatusPorcelain } from '../utils/gitUtils';
import { readContextFiles, resolveWorkspaceRoot } from '../utils/workspaceUtils';

export interface ClaudeCodeCLIAdapterOptions {
  workspaceRoot?: string;
  model?: string;
}

const DEFAULT_MODEL = 'sonnet';

export class ClaudeCodeCLIAdapter implements CodeGenerationAdapter {
  public readonly type = 'claude-code' as const;
  private workspaceRoot: string;
  private model: string;

  constructor(options?: ClaudeCodeCLIAdapterOptions) {
    this.workspaceRoot = resolveWorkspaceRoot(options?.workspaceRoot);
    this.model = options?.model || DEFAULT_MODEL;
  }

  /**
   * Check if Claude Code CLI is available
   */
  async checkAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['claude'], {
        stdio: 'pipe',
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Build the full prompt with context files
   */
  private buildPrompt(
    prompt: string,
    contextFiles?: readonly string[]
  ): string {
    const parts: string[] = [];

    if (contextFiles && contextFiles.length > 0) {
      const contexts = readContextFiles(this.workspaceRoot, contextFiles);
      if (contexts.length > 0) {
        parts.push("# Reference Files\n");
        const contextContent = contexts
          .map((ctx) => {
            const ext = path.extname(ctx.path).slice(1) || "typescript";
            return `### ${ctx.path}\n\`\`\`${ext}\n${ctx.content}\n\`\`\``;
          })
          .join("\n\n");
        parts.push(contextContent);
        parts.push("\n---\n");
      }
    }

    parts.push("# Task\n");
    parts.push(prompt);
    parts.push(
      "\n\nCreate/update the necessary file(s). Do not output code to the terminal - write it to files instead."
    );

    return parts.join("\n");
  }

  /**
   * Generate code using Claude Code CLI
   * @param timeout Timeout in milliseconds, or null for no timeout
   */
  async generate(
    prompt: string,
    contextFiles?: readonly string[],
    timeout?: number | null
  ): Promise<string[]> {
    const fullPrompt = this.buildPrompt(prompt, contextFiles);

    // Capture git status before generation
    const statusBefore = getGitStatusPorcelain(this.workspaceRoot);

    // Write prompt to temp file and pipe via stdin (matches @copilot-evals pattern)
    return new Promise((resolve, reject) => {
      const tempFile = path.join(this.workspaceRoot, '.claude-eval-prompt.txt');
      fs.writeFileSync(tempFile, fullPrompt, 'utf8');

      // Cleanup function
      const cleanup = (): void => {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch {
          // Ignore cleanup errors
        }
      };

      // Register cleanup on process termination
      const cleanupOnExit = (): void => {
        cleanup();
      };
      process.once('SIGINT', cleanupOnExit);
      process.once('SIGTERM', cleanupOnExit);

      const command = `cat "${tempFile}" | claude --model ${this.model} --dangerously-skip-permissions --disallowed-tools 'Bash(rm)' --disallowed-tools 'Bash(git push)' --disallowed-tools 'Bash(git commit)'`;
      const proc = spawn('sh', ['-c', command], {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout only if specified (null/undefined = no timeout)
      let timeoutHandle: NodeJS.Timeout | null = null;
      if (timeout !== null && timeout !== undefined) {
        timeoutHandle = setTimeout(() => {
          proc.kill('SIGTERM');
          cleanup();
          process.removeListener('SIGINT', cleanupOnExit);
          process.removeListener('SIGTERM', cleanupOnExit);
          reject(new Error(`Claude Code CLI timed out after ${timeout}ms`));
        }, timeout);
      }

      proc.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        cleanup();
        process.removeListener('SIGINT', cleanupOnExit);
        process.removeListener('SIGTERM', cleanupOnExit);

        if (code !== 0) {
          reject(new Error(`Claude Code CLI exited with code ${code}\nStderr: ${stderr}`));
          return;
        }

        // Get files changed during generation (diff before/after)
        try {
          const statusAfter = getGitStatusPorcelain(this.workspaceRoot);
          const changedFiles = getChangedFilesDiff(statusBefore, statusAfter);
          resolve(changedFiles);
        } catch (error) {
          reject(new Error(`Failed to get changed files: ${error}`));
        }
      });

      proc.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        cleanup();
        process.removeListener('SIGINT', cleanupOnExit);
        process.removeListener('SIGTERM', cleanupOnExit);
        reject(new Error(`Failed to spawn Claude Code CLI: ${error}`));
      });
    });
  }
}
