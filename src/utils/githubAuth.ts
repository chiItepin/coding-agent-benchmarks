/**
 * GitHub authentication utilities
 */

import { execSync } from 'child_process';

/**
 * Get GitHub token from environment or GitHub CLI
 * @returns GitHub token or undefined if not found
 */
export function getGitHubToken(): string | undefined {
  // 1. Try environment variable first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // 2. Try GitHub CLI
  try {
    const token = execSync('gh auth token', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (token && token.startsWith('gh')) {
      return token;
    }
  } catch {
    // GitHub CLI not installed or not authenticated
  }

  return undefined;
}

/**
 * Check if GitHub authentication is available
 * @returns Object with availability status and method used
 */
export function checkGitHubAuth(): {
  available: boolean;
  method?: 'env' | 'gh-cli';
  message: string;
} {
  if (process.env.GITHUB_TOKEN) {
    return {
      available: true,
      method: 'env',
      message: 'Using GITHUB_TOKEN from environment variable',
    };
  }

  try {
    execSync('gh auth token', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
      available: true,
      method: 'gh-cli',
      message: 'Using token from GitHub CLI (gh auth token)',
    };
  } catch {
    return {
      available: false,
      message: 'GitHub token not found. See: https://github.com/settings/tokens',
    };
  }
}

/**
 * Print helpful instructions for setting up GitHub authentication
 */
export function printGitHubAuthHelp(): void {
  console.log('\n⚠️  GitHub token required for LLM-as-judge validation\n');
  console.log('Option 1: Set GITHUB_TOKEN environment variable');
  console.log('  1. Create token: https://github.com/settings/tokens');
  console.log('  2. Select scope: models:read');
  console.log('  3. Set: export GITHUB_TOKEN=ghp_xxxxxxxxxxxx\n');
  console.log('Option 2: Use GitHub CLI (automatic)');
  console.log('  1. Install: brew install gh (or from https://cli.github.com)');
  console.log('  2. Authenticate: gh auth login');
  console.log('  3. Token will be used automatically\n');
}
