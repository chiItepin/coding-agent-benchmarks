/**
 * GitHub Copilot CLI Adapter
 */

import { spawn } from 'child_process';
import { CodeGenerationAdapter } from '../types';
import { getChangedFiles, resetGitWorkingDirectory } from '../utils/gitUtils';
import { readContextFiles, resolveWorkspaceRoot } from '../utils/workspaceUtils';

export class CopilotCLIAdapter implements CodeGenerationAdapter {
  public readonly type = 'copilot' as const;
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = resolveWorkspaceRoot(workspaceRoot);
  }

  /**
   * Check if GitHub Copilot CLI is available
   */
  async checkAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['copilot'], {
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
   * Generate code using GitHub Copilot CLI
   * @param timeout Timeout in milliseconds, or null for no timeout
   */
  async generate(
    prompt: string,
    contextFiles?: readonly string[],
    timeout?: number | null
  ): Promise<string[]> {
    // Reset workspace to clean state before generation
    try {
      resetGitWorkingDirectory(this.workspaceRoot);
    } catch (error) {
      console.warn('Warning: Could not reset git working directory:', error);
    }

    // Build the full prompt with context
    let fullPrompt = prompt;

    if (contextFiles && contextFiles.length > 0) {
      const contexts = readContextFiles(this.workspaceRoot, contextFiles);
      if (contexts.length > 0) {
        const contextSection = contexts
          .map(ctx => `\n\n### Context from ${ctx.path}:\n\`\`\`\n${ctx.content}\n\`\`\``)
          .join('\n');
        fullPrompt = `${prompt}${contextSection}`;
      }
    }

    // Spawn the copilot CLI process
    return new Promise((resolve, reject) => {
      const proc = spawn('copilot', [fullPrompt], {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
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
          reject(new Error(`Copilot CLI timed out after ${timeout}ms`));
        }, timeout);
      }

      proc.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        if (code !== 0) {
          reject(new Error(`Copilot CLI exited with code ${code}\nStderr: ${stderr}`));
          return;
        }

        // Get the list of changed files
        try {
          const changedFiles = getChangedFiles(this.workspaceRoot);
          resolve(changedFiles);
        } catch (error) {
          reject(new Error(`Failed to get changed files: ${error}`));
        }
      });

      proc.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        reject(new Error(`Failed to spawn Copilot CLI: ${error}`));
      });
    });
  }
}
