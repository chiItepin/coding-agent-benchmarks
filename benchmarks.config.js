module.exports = {
  // Default adapter to use
  defaultAdapter: 'copilot',

  // Default LLM model for judge
  defaultModel: 'openai/gpt-4.1',

  // Default timeout for code generation (milliseconds)
  // Individual scenarios can override this
  // Default: 120000 (2 minutes)
  defaultTimeout: 180000, // 3 minutes

  // Workspace root (auto-detected if not specified)
  workspaceRoot: process.cwd(),

  // Define your test scenarios
  scenarios: [
    {
      id: 'typescript-no-any',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'types', 'safety'],
      description: 'Ensure TypeScript interfaces use explicit types instead of "any"',
      prompt:
        'Create a TypeScript interface called User with fields: id (number), name (string), email (string), and metadata (object with key-value pairs)',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/],
          requiredPatterns: [/interface\s+User/],
        },
      },
      timeout: 120000,
    },
  ],
};
