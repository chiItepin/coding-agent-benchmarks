/**
 * Git utilities for tracking file changes
 */

import { execSync } from 'child_process';

/**
 * Get git status in porcelain format
 * @param workspaceRoot The workspace root directory
 * @returns Git status output
 */
export const getGitStatusPorcelain = (workspaceRoot: string): string => {
  try {
    return execSync('git status --porcelain', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`Failed to get git status: ${error}`);
  }
};

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
export const getChangedFiles = (workspaceRoot: string): string[] => {
  const statusOutput = getGitStatusPorcelain(workspaceRoot);
  return parseGitStatus(statusOutput);
};

/**
 * Get files that changed between two git status snapshots
 * @param before Git status output before operation
 * @param after Git status output after operation
 * @returns Array of file paths that were added or modified
 */
export const getChangedFilesDiff = (before: string, after: string): string[] => {
  const beforeLines = new Set(before.split('\n').filter(Boolean));
  const afterLines = after.split('\n').filter(Boolean);

  const newOrModified: string[] = [];

  for (const line of afterLines) {
    if (!beforeLines.has(line)) {
      // Extract file path (e.g. "?? src/file.tsx" becomes "src/file.tsx")
      const match = /^.{3}(.+)$/.exec(line);
      if (match) {
        const filePath = match[1];
        // Skip directories (end with /)
        if (!filePath.endsWith('/')) {
          newOrModified.push(filePath);
        }
      }
    }
  }

  return newOrModified;
};

/**
 * Get the git root directory
 * @returns Absolute path to git root
 */
export const getGitRoot = (): string => {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error('Not inside a git repository');
  }
};

/**
 * Check if a directory is inside a git repository
 * @param directory Directory to check
 * @returns True if inside a git repository
 */
export const isGitRepository = (directory: string): boolean => {
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
};


