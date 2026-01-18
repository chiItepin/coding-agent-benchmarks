/**
 * Default test scenarios
 */

import { TestScenario } from '../types';

export const getDefaultScenarios = (): TestScenario[] => [
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
          forbiddenPatterns: [/:\s*any\b/, /:\s*any\s*[,;]/],
          requiredPatterns: [/interface\s+User/],
        },
      },
      timeout: 120000,
    },

    {
      id: 'typescript-readonly-props',
      category: 'typescript',
      severity: 'major',
      tags: ['typescript', 'immutability', 'best-practices'],
      description: 'Enforce readonly properties in TypeScript interfaces',
      prompt:
        'Create a TypeScript interface called AppConfig with readonly properties: apiUrl (string), timeout (number), and features (array of strings)',
      validationStrategy: {
        patterns: {
          requiredPatterns: [
            /interface\s+AppConfig/,
            /readonly\s+apiUrl/,
            /readonly\s+timeout/,
            /readonly\s+features/,
          ],
        },
      },
      timeout: 120000,
    },

    {
      id: 'react-no-inline-styles',
      category: 'react',
      severity: 'major',
      tags: ['react', 'styling', 'best-practices'],
      description: 'Forbid inline style objects in React components',
      prompt:
        'Create a React functional component called Button that accepts a "label" prop and renders a styled button. Use CSS classes instead of inline styles.',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [
            /style\s*=\s*\{\{/,
            /style\s*=\s*\{[^}]*\}/,
          ],
          requiredPatterns: [
            /function\s+Button|const\s+Button.*=|export\s+(default\s+)?function\s+Button/,
            /className/,
          ],
        },
      },
      timeout: 120000,
    },

    {
      id: 'react-proper-hooks',
      category: 'react',
      severity: 'critical',
      tags: ['react', 'hooks', 'correctness'],
      description: 'Ensure React hooks are not called conditionally',
      prompt:
        'Create a React component called UserProfile that uses useState to manage a "loading" state and useEffect to fetch user data. Make sure hooks are used correctly.',
      validationStrategy: {
        patterns: {
          // Forbid hooks inside if statements or loops
          forbiddenPatterns: [
            /if\s*\([^)]*\)\s*\{[^}]*use(State|Effect|Context|Reducer|Callback|Memo|Ref)/,
          ],
          requiredPatterns: [
            /useState/,
            /useEffect/,
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate whether this React component follows the Rules of Hooks:
1. Hooks must be called at the top level (not inside conditions, loops, or nested functions)
2. Hooks must be called in the same order every render
3. useState and useEffect should be used correctly

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
      timeout: 120000,
    },

    {
      id: 'async-error-handling',
      category: 'general',
      severity: 'critical',
      tags: ['async', 'error-handling', 'robustness'],
      description: 'Ensure async functions have proper error handling',
      prompt:
        'Create an async function called fetchUserData that takes a userId parameter, makes an HTTP request to fetch user data, and returns the user object. Handle errors appropriately.',
      validationStrategy: {
        patterns: {
          requiredPatterns: [
            /async\s+function\s+fetchUserData|const\s+fetchUserData.*async/,
            /try|catch|\.catch\(/,
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate the error handling in this async function:
1. Does it use try/catch or .catch()?
2. Are errors logged or re-thrown appropriately?
3. Does it prevent unhandled promise rejections?

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
      timeout: 120000,
    },

    {
      id: 'typescript-explicit-return-types',
      category: 'typescript',
      severity: 'major',
      tags: ['typescript', 'types', 'documentation'],
      description: 'Functions should have explicit return type annotations',
      prompt:
        'Create a TypeScript function called calculateTotal that takes an array of numbers and returns their sum. Include explicit type annotations for parameters and return type.',
      validationStrategy: {
        patterns: {
          requiredPatterns: [
            /function\s+calculateTotal.*:\s*number|const\s+calculateTotal.*:\s*\([^)]*\)\s*=>\s*number/,
          ],
        },
      },
      timeout: 120000,
    },

    {
      id: 'typescript-strict-null-safety',
      category: 'typescript',
      severity: 'critical',
      tags: ['typescript', 'null-safety', 'types', 'best-practices'],
      description: 'Proper null/undefined handling with optional chaining and type guards',
      prompt:
        'Create a TypeScript function called getUserEmail that takes a user object (which might be null or undefined) and returns their email address. The user object has an optional email field. Handle all null/undefined cases safely without using type assertions (as or !).',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [
            /as\s+\w+/,                    // No type assertions
            /!\s*\./,                      // No non-null assertions
            /!\s*\[/,                      // No non-null assertions on arrays
          ],
          requiredPatterns: [
            /function\s+getUserEmail|const\s+getUserEmail/,
            /\?\.|if\s*\(.*\)/,           // Optional chaining or null checks
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate the null safety of this function:
1. Does it handle null/undefined user objects safely?
2. Does it handle undefined email fields?
3. Does it avoid type assertions (as, !) and use proper type guards or optional chaining?
4. Does it have a clear return type that reflects possible null/undefined?

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
      timeout: 120000,
    },

    {
      id: 'no-console-logs-production',
      category: 'general',
      severity: 'minor',
      tags: ['logging', 'production', 'cleanup'],
      description: 'Production code should not contain console.log statements',
      prompt:
        'Create a utility function called processData that processes an array of items and returns the results. Include proper error handling but avoid console.log statements.',
      validationStrategy: {
        patterns: {
          forbiddenPatterns: [/console\.log/],
        },
      },
      timeout: 120000,
    },

    {
      id: 'react-key-prop',
      category: 'react',
      severity: 'critical',
      tags: ['react', 'lists', 'performance'],
      description: 'React lists must include unique key props',
      prompt:
        'Create a React component called TodoList that renders a list of todo items from an array. Each todo has an id and text. Render them as list items.',
      validationStrategy: {
        patterns: {
          requiredPatterns: [
            /key\s*=\s*\{/,
            /\.map\(/,
          ],
        },
        llmJudge: {
          enabled: true,
          judgmentPrompt: `Evaluate if the React component properly uses key props:
1. Are key props used when rendering lists?
2. Are the keys unique and stable?
3. Are keys based on item IDs rather than indexes?

Return JSON: {"passed": boolean, "score": 0-1, "reasoning": "explanation", "violations": []}`,
        },
      },
      timeout: 120000,
    },
  ];
