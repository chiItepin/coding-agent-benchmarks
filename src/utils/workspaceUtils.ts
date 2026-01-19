/**
 * Utilities for workspace root resolution
 */

import * as path from 'path';
import * as fs from 'fs';
import { getGitRoot, isGitRepository } from './gitUtils';

/**
 * Resolve the workspace root directory
 * Priority:
 * 1. Explicit workspaceRoot from config
 * 2. Git repository root
 * 3. Current working directory
 *
 * @param explicitRoot Optional explicit workspace root from config
 * @returns Absolute path to workspace root
 */
export const resolveWorkspaceRoot = (explicitRoot?: string): string => {
  // 1. Use explicit root if provided
  if (explicitRoot) {
    const resolved = path.resolve(explicitRoot);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`Specified workspace root does not exist: ${resolved}`);
  }

  // 2. Try to get git root
  try {
    const gitRoot = getGitRoot();
    if (gitRoot) {
      return gitRoot;
    }
  } catch {
    // Not a git repository, continue
  }

  // 3. Fall back to current working directory
  return process.cwd();
};

/**
 * Resolve file paths relative to workspace root
 * @param workspaceRoot Workspace root directory
 * @param relativePaths Relative file paths
 * @returns Absolute file paths
 */
export const resolveFilePaths = (
  workspaceRoot: string,
  relativePaths: readonly string[]
): string[] => {
  return relativePaths.map(relativePath => {
    // If already absolute, return as-is
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    // Otherwise, resolve relative to workspace root
    return path.resolve(workspaceRoot, relativePath);
  });
};

/**
 * Read context files and return their contents
 * @param workspaceRoot Workspace root directory
 * @param contextFiles Array of context file paths (relative or absolute)
 * @returns Array of file contents with metadata
 */
export const readContextFiles = (
  workspaceRoot: string,
  contextFiles: readonly string[]
): Array<{ path: string; content: string }> => {
  const absolutePaths = resolveFilePaths(workspaceRoot, contextFiles);
  const results: Array<{ path: string; content: string }> = [];

  for (const absolutePath of absolutePaths) {
    try {
      if (!fs.existsSync(absolutePath)) {
        console.warn(`Context file not found: ${absolutePath}`);
        continue;
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');
      results.push({
        path: path.relative(workspaceRoot, absolutePath),
        content,
      });
    } catch (error) {
      console.warn(`Failed to read context file ${absolutePath}: ${error}`);
    }
  }

  return results;
};
