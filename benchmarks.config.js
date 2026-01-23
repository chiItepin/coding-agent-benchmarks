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
  saveBaseline: true,
  compareBaseline: true,
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
          requiredPatterns: [/interface\s+User\b/],
        },
      },
    },

    // ============================================================
    // AUTO-GENERATED SCENARIOS
    // Generated on: 2026-01-22
    // Sources: CLAUDE.md, tsconfig.json
    // Total: 34 new scenarios
    // ============================================================

    // === CRITICAL SCENARIOS (TypeScript Type Safety) ===

    {
      id: 'typescript-no-any-function-params',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Function parameters must have explicit type annotations, no any type',
      prompt: `Build a generic data transformation utility function called 'transformArray' that takes an array of objects, a mapper function, and optional filter criteria, then returns a new transformed array. Ensure full type safety for all parameters and return values.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/, /\)\s*=>/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that all function parameters have explicit type annotations. No parameter should have an implicit 'any' type or be missing type declarations. Return JSON with passed (boolean), score (0-1), reasoning, and violations array.`,
        },
      },
    },

    {
      id: 'typescript-no-any-json-parsing',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'JSON parsing must use typed interfaces, not any',
      prompt: `Create a TypeScript function called 'parseConfig' that reads a JSON configuration file and returns a typed configuration object with properties: apiUrl (string), timeout (number), retryAttempts (number), enableCache (boolean), and headers (object with string keys and string values).`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/],
          requiredPatterns: [/interface|type\s+\w+Config/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify that JSON parsing returns a properly typed object, not 'any'. Check for interface or type definition and proper return type annotation.`,
        },
      },
    },

    {
      id: 'typescript-strict-null-safety',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'tsconfig.json', 'pattern'],
      description: 'Code must handle null and undefined explicitly with strict null checks',
      prompt: `Create a function called 'getUserById' that looks up a user by ID from a Map<string, User> data structure and returns the user object. Handle the case where the user might not exist and provide appropriate error handling or return type.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/!\s*[;,\)]/], // No non-null assertions
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify that the function properly handles the case where the user might not exist. It should use optional return types (User | undefined), null checks, or error handling. Flag usage of non-null assertion operator (!).`,
        },
      },
    },

    {
      id: 'typescript-explicit-return-types',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Functions must have explicit return type annotations',
      prompt: `Write an async function called 'fetchUserData' that makes an API call to retrieve user information, processes the response, and returns a structured user object. Include proper error handling.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/async\s+function\s+\w+\([^)]*\)\s*\{/],
          requiredPatterns: [/async\s+function\s+\w+\([^)]*\)\s*:\s*Promise</],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that async functions have explicit Promise<T> return type annotations. The return type should not be inferred.`,
        },
      },
    },

    {
      id: 'typescript-no-ts-ignore',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Code must not use @ts-ignore or @ts-expect-error comments',
      prompt: `Create a type-safe event emitter class that allows registering event listeners with typed event payloads. Support multiple event types with different payload structures.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/@ts-ignore/, /@ts-expect-error/],
        },
      },
    },

    {
      id: 'typescript-generic-constraints',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Generic types must have proper constraints, avoid any',
      prompt: `Build a generic cache class that can store and retrieve values of any type with a string key. Include methods for get, set, has, and delete operations with full type safety.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/:\s*any\b/],
          requiredPatterns: [/<[A-Z]\w*>/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify generic type parameters are properly constrained and used correctly throughout the class. No use of 'any' type.`,
        },
      },
    },

    // === MAJOR SCENARIOS (Architecture & Best Practices) ===

    {
      id: 'single-responsibility-user-registration',
      category: 'architecture',
      severity: 'major',
      tags: ['architecture', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Functions should have a single, focused responsibility (SRP)',
      prompt: `Build a user registration system that validates user input (email format, password strength, required fields), checks for duplicate emails in a database, hashes the password, saves the user to the database, and sends a welcome email. Organize the code following best practices.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate if the code follows Single Responsibility Principle. Each function should do ONE thing well. Check if responsibilities are separated:
- Input validation (separate function)
- Duplicate checking (separate function)
- Password hashing (separate function)
- Database operations (separate function)
- Email sending (separate function)

Score based on separation of concerns. Flag if one function handles multiple responsibilities. Return JSON with passed (boolean), score (0-1 where 1 is perfect SRP), reasoning, and violations array listing which functions violate SRP.`,
        },
      },
    },

    {
      id: 'single-responsibility-file-upload',
      category: 'architecture',
      severity: 'major',
      tags: ['architecture', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Keep file processing functions focused on single responsibility',
      prompt: `Create a file upload handler that validates file types and sizes, sanitizes filenames, stores files to disk or cloud storage, creates database records tracking the uploads, and generates thumbnail images for image uploads.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check if the code separates concerns properly:
- File validation (separate)
- Filename sanitization (separate)
- Storage operations (separate)
- Database recording (separate)
- Thumbnail generation (separate)

Each responsibility should be in its own function. Score based on modularity and separation.`,
        },
      },
    },

    {
      id: 'readonly-arrays-params',
      category: 'typescript',
      severity: 'major',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use readonly for arrays/objects that should not be mutated',
      prompt: `Create a function called 'calculateStatistics' that takes an array of numbers and returns an object with sum, average, median, min, and max values. The function should not modify the input array.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/readonly\s+\w+\[\]|ReadonlyArray/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify that the function parameter uses 'readonly' modifier for the array parameter and does not mutate the input. Check for Array.sort(), Array.reverse(), or other mutating operations on the input.`,
        },
      },
    },

    {
      id: 'readonly-immutable-config',
      category: 'typescript',
      severity: 'major',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Configuration objects should be readonly to prevent mutation',
      prompt: `Design a configuration system for an application with default settings and user overrides. Create a function that merges default config with user config and returns an immutable configuration object.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/Readonly<|readonly\s+/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that configuration objects use Readonly<T> or readonly properties to prevent accidental mutation.`,
        },
      },
    },

    {
      id: 'async-await-pattern',
      category: 'general',
      severity: 'major',
      tags: ['async', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Always use async/await pattern, not callbacks or raw promises',
      prompt: `Create a data fetching utility that retrieves user information from an API, then fetches their posts, and finally enriches each post with comment counts from another API endpoint. Handle errors appropriately.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/\.then\(/, /\.catch\(/],
          requiredPatterns: [/async\s+/, /await\s+/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify the code uses async/await syntax instead of .then()/.catch() promise chains or callback functions. Modern async/await should be used throughout.`,
        },
      },
    },

    {
      id: 'error-handling-descriptive',
      category: 'general',
      severity: 'major',
      tags: ['error-handling', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use try/catch with descriptive error messages',
      prompt: `Write a function that processes a batch of image files - reads each file, validates the format, resizes the images, and saves them to an output directory. Include proper error handling for file operations.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/try\s*\{/, /catch\s*\(/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that:
1. try/catch blocks are used for error-prone operations
2. Error messages are descriptive and include context
3. Errors are not silently swallowed
4. Error types are appropriate (not generic Error for everything)

Score based on error handling quality.`,
        },
      },
    },

    {
      id: 'avoid-external-dependencies',
      category: 'architecture',
      severity: 'major',
      tags: ['dependencies', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Avoid external dependencies unless absolutely necessary',
      prompt: `Create a utility module with functions for: debouncing function calls, deep cloning objects, generating unique IDs, and formatting dates as ISO strings. Use only built-in JavaScript/TypeScript features.`,
      validationStrategy: {
        patterns: {
          forbiddenImports: ['lodash', 'underscore', 'moment', 'date-fns', 'uuid'],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify that the code does not import external utility libraries when built-in features suffice. Check that common utilities are implemented using native JavaScript/TypeScript.`,
        },
      },
    },

    {
      id: 'descriptive-naming-clarity',
      category: 'general',
      severity: 'major',
      tags: ['naming', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Use descriptive names that prefer clarity over brevity',
      prompt: `Create a function that calculates the time difference between two dates and returns the result in various units (milliseconds, seconds, minutes, hours, days). Include helper functions as needed.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/\b(x|y|z|foo|bar|tmp|temp|data|info|val)\b/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate naming quality:
- Are variable names descriptive and clear?
- Do function names indicate their purpose?
- Avoid single-letter names (except standard loop counters)
- Avoid generic names like 'data', 'info', 'temp'
- Names should be self-documenting

Score based on overall naming clarity.`,
        },
      },
    },

    // === MINOR SCENARIOS (Style & Conventions) ===

    {
      id: 'prefer-foreach-simple-iteration',
      category: 'general',
      severity: 'minor',
      tags: ['iteration', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use array.forEach() for iteration with side effects instead of for-loops',
      prompt: `Create a function called 'printUserReport' that takes an array of user objects and prints each user's name, email, and account status to the console in a formatted way.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/\.forEach\(/],
          forbiddenPatterns: [/for\s*\(/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check if the code uses array.forEach() for printing/logging (side effects). Exception: for-of is acceptable when building new arrays or early returns are needed. Flag use of C-style for loops.`,
        },
      },
    },

    {
      id: 'prefer-foreach-async-operations',
      category: 'general',
      severity: 'minor',
      tags: ['iteration', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use forEach or for-of for async operations on arrays',
      prompt: `Write a function that takes an array of user IDs and sends a notification to each user by calling an async sendNotification() function. Process all notifications.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `For async operations on arrays, check that the code uses either:
- for-of loop with await (acceptable)
- Promise.all with map (acceptable)
- forEach with proper async handling (acceptable)

Avoid C-style for loops when iterating for side effects.`,
        },
      },
    },

    {
      id: 'const-assertions-literals',
      category: 'typescript',
      severity: 'minor',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use const assertions for literal types',
      prompt: `Create a configuration object for different environment modes (development, staging, production) with their respective API URLs, debug flags, and feature toggles. The configuration should have precise literal types.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/as\s+const/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check if the code uses 'as const' assertion for object literals that should have precise literal types rather than widened types.`,
        },
      },
    },

    {
      id: 'meaningful-comments-why-not-what',
      category: 'general',
      severity: 'minor',
      tags: ['comments', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Comments should explain "why" not "what" - avoid redundant comments',
      prompt: `Create a complex algorithm that finds the longest common subsequence between two strings using dynamic programming. Include appropriate comments where needed.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate comment quality:

GOOD comments (explain WHY):
- "// Using DP to avoid O(2^n) recursive complexity"
- "// Edge case: empty strings should return 0"
- "// Cache results to handle repeated calls efficiently"

BAD comments (restate WHAT):
- "// Initialize variable"
- "// Loop through array"
- "// Set value to true"

Score based on whether comments add value or just restate obvious code. Flag redundant comments. Award points for explaining algorithms, edge cases, and non-obvious decisions.`,
        },
      },
    },

    {
      id: 'no-redundant-jsdoc',
      category: 'general',
      severity: 'minor',
      tags: ['comments', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Avoid unnecessary JSDoc for obvious internal functions',
      prompt: `Create a module with utility functions for string manipulation: capitalize, truncate, slugify, and remove special characters. Include only necessary documentation.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check JSDoc usage:
- Public API functions: JSDoc encouraged with @param, @returns
- Internal/private helpers: Minimal or no JSDoc (code should be self-evident)
- Avoid redundant JSDoc that just restates the function signature

Flag excessive JSDoc on simple, self-explanatory functions.`,
        },
      },
    },

    {
      id: 'naming-convention-classes',
      category: 'general',
      severity: 'minor',
      tags: ['naming', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use PascalCase for classes and interfaces',
      prompt: `Design a class hierarchy for a task management system: a base Task class, and specialized classes for RecurringTask, PriorityTask, and DependentTask. Include appropriate interfaces.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/class\s+[A-Z][a-z]+/, /interface\s+[A-Z][a-z]+/],
          forbiddenPatterns: [/class\s+[a-z]/, /interface\s+[a-z]/],
        },
      },
    },

    {
      id: 'naming-convention-functions',
      category: 'general',
      severity: 'minor',
      tags: ['naming', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use camelCase for functions and variables',
      prompt: `Create utility functions for working with arrays: filter null values, group by property, sort by multiple criteria, and find duplicates.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/function\s+[a-z][a-zA-Z]*/, /const\s+[a-z][a-zA-Z]*\s*=/],
          forbiddenPatterns: [/function\s+[A-Z]/, /const\s+[A-Z][a-z]*\s*=/],
        },
      },
    },

    {
      id: 'naming-convention-constants',
      category: 'general',
      severity: 'minor',
      tags: ['naming', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use UPPER_SNAKE_CASE for true constants',
      prompt: `Define configuration constants for an HTTP client: default timeout values, maximum retry attempts, API base URLs, supported HTTP methods, and status code ranges for different categories (success, client error, server error).`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/const\s+[A-Z][A-Z_]*\s*=/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that true constants (compile-time values that never change) use UPPER_SNAKE_CASE naming convention.`,
        },
      },
    },

    {
      id: 'one-export-per-file-classes',
      category: 'architecture',
      severity: 'minor',
      tags: ['architecture', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Prefer one class or interface per file when possible',
      prompt: `Create a Logger class with methods for different log levels (debug, info, warn, error), configurable output destinations, and log formatting capabilities.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `If the code creates multiple classes, check if they're in separate files or all in one file. Prefer one class per file for better organization. Small helper classes/interfaces can be in the same file if tightly coupled.`,
        },
      },
    },

    {
      id: 'export-from-index',
      category: 'architecture',
      severity: 'minor',
      tags: ['architecture', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Export public APIs from index.ts barrel file',
      prompt: `Design a validation library with multiple validators (email, phone, URL, credit card). Create a clean public API structure with an index file that exports the public interface.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check if the code creates an index.ts (or index.js) file that re-exports the public API. For libraries and modules, barrel exports improve the import experience.`,
        },
      },
    },

    {
      id: 'typescript-strict-mode-comprehensive',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'auto-generated', 'tsconfig.json', 'pattern'],
      description: 'Code must pass all TypeScript strict mode checks',
      prompt: `Create an async data synchronization service that fetches data from multiple sources, merges the results, handles conflicts, caches the output, and provides type-safe access to the synchronized data. Include error handling for network failures.`,
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [
            /:\s*any\b/,
            /@ts-ignore/,
            /@ts-expect-error/,
            /!\s*[;,\)]/,
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Verify the code would pass TypeScript strict mode compilation:
- No 'any' types
- All parameters have explicit types
- Proper null/undefined handling
- No type assertions without validation
- No @ts-ignore comments
- Return types are explicit

This is a comprehensive check for type safety.`,
        },
      },
    },

    {
      id: 'prefer-foreach-event-handling',
      category: 'general',
      severity: 'minor',
      tags: ['iteration', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use forEach for event dispatching and callback execution',
      prompt: `Create an EventEmitter class that maintains a map of event names to listener functions. Implement the emit() method that triggers all registered listeners for a given event with the provided arguments.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/\.forEach\(/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `For executing callbacks/listeners (side effects), verify the code uses forEach instead of for loops.`,
        },
      },
    },

    {
      id: 'async-await-error-handling',
      category: 'general',
      severity: 'major',
      tags: ['async', 'error-handling', 'auto-generated', 'CLAUDE.md'],
      description: 'Async functions must have proper try/catch error handling',
      prompt: `Write an async function that downloads a file from a URL, validates its checksum, and saves it to disk. Include timeout handling and retry logic for failed downloads.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/try\s*\{/, /catch\s*\(/],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that async operations are wrapped in try/catch blocks. Verify that errors are properly handled and not silently ignored. For network operations, check for timeout and retry logic.`,
        },
      },
    },

    {
      id: 'commonjs-module-exports',
      category: 'general',
      severity: 'minor',
      tags: ['modules', 'auto-generated', 'tsconfig.json', 'pattern'],
      description: 'Use CommonJS module.exports, not ES6 export syntax',
      prompt: `Create a configuration module that exports utility functions for loading config from files, environment variables, and command-line arguments, with a default export for the main config object.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/module\.exports|exports\./],
          forbiddenPatterns: [/export\s+(default|const|function|class)/],
        },
      },
    },

    {
      id: 'readonly-function-params-objects',
      category: 'typescript',
      severity: 'major',
      tags: ['typescript', 'auto-generated', 'CLAUDE.md', 'pattern'],
      description: 'Use readonly for object parameters that should not be mutated',
      prompt: `Create a function that generates a report from a configuration object containing report title, data fields, formatting options, and filter criteria. The function should not modify the input configuration.`,
      validationStrategy: {
        patterns: {
          requiredPatterns: [/readonly|Readonly</],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check that object parameters use readonly modifier or Readonly<T> type, and verify the function does not mutate the input object.`,
        },
      },
    },

    {
      id: 'architecture-adapter-pattern',
      category: 'architecture',
      severity: 'major',
      tags: ['architecture', 'auto-generated', 'CLAUDE.md', 'llm-judge'],
      description: 'Use adapter pattern for external integrations',
      prompt: `Design an abstraction layer for sending messages through different providers (email, SMS, push notifications). Create a common interface and implementations for each provider that can be swapped without changing client code.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate the adapter pattern implementation:
- Is there a common interface/abstract class?
- Do concrete implementations follow the same contract?
- Can implementations be swapped without changing client code?
- Is the abstraction layer clean and minimal?

Score based on adherence to adapter pattern principles.`,
        },
      },
    },

    {
      id: 'no-unused-variables',
      category: 'general',
      severity: 'minor',
      tags: ['cleanup', 'auto-generated', 'tsconfig.json', 'pattern'],
      description: 'Code should not contain unused variables or imports',
      prompt: `Create a data processing pipeline that filters, transforms, and aggregates an array of transaction records. Return summary statistics including total amount, count, average, and transactions grouped by category.`,
      validationStrategy: {
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Check for unused variables, unused imports, or declared but never used functions. All declared items should serve a purpose in the code.`,
        },
      },
    },
  ],
};
