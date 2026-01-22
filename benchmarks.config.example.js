/**
 * Example configuration file for coding-agent-benchmarks
 * Copy this to benchmarks.config.js and customize for your project
 */

module.exports = {
  // Default adapter to use
  defaultAdapter: 'copilot',

  // Default LLM model for judge
  defaultModel: 'openai/gpt-4.1',

  // Default timeout for code generation (in milliseconds)
  // Individual scenarios can override this
  // Default: 120000 (2 minutes)
  defaultTimeout: 180000, // 3 minutes

  // Workspace root (auto-detected if not specified)
  // workspaceRoot: process.cwd(),

  // Enable automatic baseline saving for all evaluations (optional)
  // When enabled, results are saved to .benchmarks/baselines/{adapter}/{model}/{scenario-id}.json
  // saveBaseline: false,

  // Enable automatic baseline comparison for all evaluations (optional)
  // When enabled, results are compared with existing baselines and deltas are shown
  // compareBaseline: false,

  // Custom test scenarios
  scenarios: [
    {
      id: 'custom-typescript-strict',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'strict', 'types'],
      description: 'Ensure strict TypeScript types are used',
      prompt: 'Create a function called processUser that takes user data and returns a formatted string',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [
            /:\s*any\b/,              // No 'any' type
            /\/\/@ts-ignore/,          // No @ts-ignore comments
            /\/\/@ts-expect-error/,    // No @ts-expect-error comments
          ],
          requiredPatterns: [
            /function\s+processUser|const\s+processUser/,
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate if the function:
1. Has proper TypeScript types (no 'any')
2. Handles edge cases
3. Returns a well-formatted string

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
      timeout: 120000,
    },

    {
      id: 'custom-react-component',
      category: 'react',
      severity: 'major',
      tags: ['react', 'component', 'best-practices'],
      description: 'Create a proper React component with TypeScript',
      prompt: 'Create a React component called Card that displays a title, description, and an image. Use TypeScript and follow React best practices.',
      contextFiles: [
        // Optional: provide context files
        // 'src/types/common.ts',
        // 'src/styles/theme.css',
      ],
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [
            /style\s*=\s*\{\{/,           // No inline styles
            /:\s*any\b/,                  // No 'any' type
          ],
          requiredPatterns: [
            /interface\s+\w+Props/,       // Props interface
            /function\s+Card|const\s+Card/, // Component definition
          ],
        },
        llmJudge: {
          enabled: true,
        },
        eslint: {
          enabled: true,
        },
      },
    },

    {
      id: 'custom-api-client',
      category: 'general',
      severity: 'critical',
      tags: ['api', 'async', 'error-handling'],
      description: 'Create a robust API client with error handling',
      prompt: 'Create an API client class that makes HTTP requests with proper error handling, retries, and timeout support',
      validationStrategy: {
        patterns: {
          requiredPatterns: [
            /class\s+\w*ApiClient/,
            /try|catch|\.catch\(/,
            /async\s+/,
          ],
        },
        llmJudge: {
          enabled: true,
          model: 'openai/gpt-4.1',
          judgmentPrompt: `Evaluate the API client:
1. Does it have proper error handling?
2. Does it implement retries or timeout?
3. Is the code well-structured and maintainable?
4. Are edge cases handled?

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
    },
  ],
};
