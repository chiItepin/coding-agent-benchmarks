/**
 * Git utilities for tracking file changes
 */

import { execSync } from 'child_process';

/**
 * Get git status in porcelain format
 * @param workspaceRoot The workspace root directory
 * @returns Git status output
 */
export function getGitStatusPorcelain(workspaceRoot: string): string {
  try {
    return execSync('git status --porcelain', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`Failed to get git status: ${error}`);
  }
}

/**
 * Parse git status porcelain output to get changed files
 * @param statusOutput Output from git status --porcelain
 * @returns Array of file paths that were changed
 */
export const parseGitStatus = (statusOutput: string): string[] => {
  const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
  const files: string[] = [];

  for (const line of lines) {
    // Git porcelain format: XY filename
    // X = index status, Y = working tree status
    // We extract the filename (everything after first 3 characters)
    if (line.length > 3) {
      const filename = line.substring(3).trim();
      // Handle renamed files (format: "old -> new")
      if (filename.includes(' -> ')) {
        const newFilename = filename.split(' -> ')[1];
        files.push(newFilename);
      } else {
        files.push(filename);
      }
    }
  }

  return files;
};

/**
 * Get list of files that have changed in the working directory
 * @param workspaceRoot The workspace root directory
 * @returns Array of file paths that were changed
 */
export function getChangedFiles(workspaceRoot: string): string[] {
  const statusOutput = getGitStatusPorcelain(workspaceRoot);
  return parseGitStatus(statusOutput);
}

/**
 * Get the git root directory
 * @returns Absolute path to git root
 */
export function getGitRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error('Not inside a git repository');
  }
}

/**
 * Check if a directory is inside a git repository
 * @param directory Directory to check
 * @returns True if inside a git repository
 */
export function isGitRepository(directory: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: directory,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset git working directory to clean state (discard all changes)
 * WARNING: This will discard all uncommitted changes
 * @param workspaceRoot The workspace root directory
 */
export function resetGitWorkingDirectory(workspaceRoot: string): void {
  try {
    // Reset all tracked files
    execSync('git reset --hard HEAD', {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Remove all untracked files and directories
    execSync('git clean -fd', {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`Failed to reset git working directory: ${error}`);
  }
}
