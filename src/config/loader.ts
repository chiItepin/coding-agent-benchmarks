/**
 * Configuration file loader
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkConfig, TestScenario } from '../types';
import { getDefaultScenarios } from './defaultScenarios';

/**
 * Find configuration file in project directory
 */
const findConfigFile = (cwd: string): string | null => {
  const possiblePaths = [
    path.join(cwd, 'benchmarks.config.js'),
    path.join(cwd, 'benchmarks.config.ts'),
    path.join(cwd, 'benchmarks.config.mjs'),
    path.join(cwd, 'benchmarks.config.cjs'),
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.benchmarks) {
        return packageJsonPath;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
};

/**
 * Load configuration from a file
 */
const loadConfigFromFile = async (configPath: string): Promise<BenchmarkConfig> => {
  const ext = path.extname(configPath);

  // Load from package.json
  if (configPath.endsWith('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return packageJson.benchmarks as BenchmarkConfig;
  }

  // Load CommonJS or ESM
  try {
    // For .ts files, we'd need tsx or ts-node
    if (ext === '.ts') {
      console.warn(
        'TypeScript config files require tsx to be installed. Falling back to default config.'
      );
      return {};
    }

    // Use dynamic import for .js, .mjs, .cjs
    const configModule = await import(configPath);
    return configModule.default || configModule;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
};

/**
 * Validate configuration
 */
const validateConfig = (config: BenchmarkConfig): void => {
  if (config.scenarios) {
    for (const scenario of config.scenarios) {
      if (!scenario.id) {
        throw new Error('Scenario missing required field: id');
      }
      if (!scenario.category) {
        throw new Error(`Scenario ${scenario.id} missing required field: category`);
      }
      if (!scenario.severity) {
        throw new Error(`Scenario ${scenario.id} missing required field: severity`);
      }
      if (!scenario.description) {
        throw new Error(`Scenario ${scenario.id} missing required field: description`);
      }
      if (!scenario.prompt) {
        throw new Error(`Scenario ${scenario.id} missing required field: prompt`);
      }
      if (!scenario.validationStrategy) {
        throw new Error(
          `Scenario ${scenario.id} missing required field: validationStrategy`
        );
      }
    }
  }
};

/**
 * Merge user scenarios with default scenarios
 */
const mergeScenarios = (
  userScenarios: TestScenario[] | undefined,
  defaultScenarios: TestScenario[]
): TestScenario[] => {
  if (!userScenarios || userScenarios.length === 0) {
    return defaultScenarios;
  }

  // Create a map of user scenarios by ID
  const userScenarioMap = new Map<string, TestScenario>();
  for (const scenario of userScenarios) {
    userScenarioMap.set(scenario.id, scenario);
  }

  // Start with user scenarios
  const merged = [...userScenarios];

  // Add default scenarios that aren't overridden
  for (const defaultScenario of defaultScenarios) {
    if (!userScenarioMap.has(defaultScenario.id)) {
      merged.push(defaultScenario);
    }
  }

  return merged;
};

/**
 * Load benchmark configuration
 */
export const loadConfig = async (cwd: string = process.cwd()): Promise<{
  config: BenchmarkConfig;
  scenarios: TestScenario[];
  configPath: string | null;
}> => {
  // Find config file
  const configPath = findConfigFile(cwd);

  let userConfig: BenchmarkConfig = {};

  // Load user config if found
  if (configPath) {
    try {
      userConfig = await loadConfigFromFile(configPath);
      validateConfig(userConfig);
      console.log(`Loaded config from: ${configPath}`);
    } catch (error) {
      console.error(`Error loading config: ${error}`);
      console.log('Falling back to default scenarios');
    }
  } else {
    console.log('No config file found, using default scenarios');
  }

  // Get default scenarios
  const defaultScenarios = getDefaultScenarios();

  // Merge scenarios
  const scenarios = mergeScenarios(userConfig.scenarios, defaultScenarios);

  // Return full config with merged scenarios
  const config: BenchmarkConfig = {
    ...userConfig,
    scenarios,
  };

  return {
    config,
    scenarios,
    configPath,
  };
};
