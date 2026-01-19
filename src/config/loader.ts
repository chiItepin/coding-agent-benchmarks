/**
 * Configuration file loader
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkConfig, TestScenario } from '../types';

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
 * Load benchmark configuration
 */
export const loadConfig = async (cwd: string = process.cwd()): Promise<{
  config: BenchmarkConfig;
  scenarios: TestScenario[];
  configPath: string | null;
}> => {
  // Find config file
  const configPath = findConfigFile(cwd);

  if (!configPath) {
    throw new Error(
      'No config file found. Please create a benchmarks.config.js file with scenarios defined.'
    );
  }

  let config: BenchmarkConfig = {};

  // Load user config
  try {
    config = await loadConfigFromFile(configPath);
    validateConfig(config);
    console.log(`Loaded config from: ${configPath}`);
  } catch (error) {
    throw new Error(`Failed to load config: ${error}`);
  }

  // Ensure scenarios are defined
  if (!config.scenarios || config.scenarios.length === 0) {
    throw new Error(
      'No scenarios defined in config. Please add scenarios to your config file.'
    );
  }

  return {
    config,
    scenarios: config.scenarios,
    configPath,
  };
};
