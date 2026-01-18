/**
 * Baseline management for tracking evaluation results over time
 */

import * as fs from 'fs';
import * as path from 'path';
import { AdapterType, EvaluationResult, Violation } from '../types';

export interface BaselineData {
  scenarioId: string;
  score: number;
  violations: Violation[];
  timestamp: string;
  adapter: AdapterType;
  model?: string;
}

export class BaselineManager {
  private baselineDir: string;

  constructor(workspaceRoot: string) {
    this.baselineDir = path.join(workspaceRoot, '.benchmarks', 'baselines');
  }

  /**
   * Get the baseline file path for a scenario
   */
  private getBaselinePath(
    adapter: AdapterType,
    model: string,
    scenarioId: string
  ): string {
    return path.join(this.baselineDir, adapter, model, `${scenarioId}.json`);
  }

  /**
   * Save a baseline result
   */
  saveBaseline(
    result: EvaluationResult,
    adapter: AdapterType,
    model: string = 'default'
  ): void {
    const baseline: BaselineData = {
      scenarioId: result.scenario.id,
      score: result.score,
      violations: result.violations,
      timestamp: new Date().toISOString(),
      adapter,
      model,
    };

    const baselinePath = this.getBaselinePath(adapter, model, result.scenario.id);
    const dir = path.dirname(baselinePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write baseline file
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf-8');
  }

  /**
   * Load a baseline result
   */
  loadBaseline(
    adapter: AdapterType,
    model: string,
    scenarioId: string
  ): BaselineData | null {
    const baselinePath = this.getBaselinePath(adapter, model, scenarioId);

    if (!fs.existsSync(baselinePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(baselinePath, 'utf-8');
      return JSON.parse(content) as BaselineData;
    } catch (error) {
      console.warn(`Failed to load baseline for ${scenarioId}:`, error);
      return null;
    }
  }

  /**
   * Compare current result with baseline
   */
  compareWithBaseline(
    result: EvaluationResult,
    adapter: AdapterType,
    model: string = 'default'
  ): {
    baselineScore: number;
    delta: number;
    isImprovement: boolean;
  } | null {
    const baseline = this.loadBaseline(adapter, model, result.scenario.id);

    if (!baseline) {
      return null;
    }

    const delta = result.score - baseline.score;
    const isImprovement = delta > 0;

    return {
      baselineScore: baseline.score,
      delta,
      isImprovement,
    };
  }

  /**
   * List all baselines for an adapter
   */
  listBaselines(adapter: AdapterType, model?: string): BaselineData[] {
    const baselines: BaselineData[] = [];

    const adapterDir = path.join(this.baselineDir, adapter);
    if (!fs.existsSync(adapterDir)) {
      return baselines;
    }

    // If model specified, only search that model directory
    if (model) {
      const modelDir = path.join(adapterDir, model);
      if (fs.existsSync(modelDir)) {
        this.collectBaselinesFromDir(modelDir, baselines);
      }
    } else {
      // Search all model directories
      const modelDirs = fs.readdirSync(adapterDir, { withFileTypes: true });
      for (const dir of modelDirs) {
        if (dir.isDirectory()) {
          const modelDir = path.join(adapterDir, dir.name);
          this.collectBaselinesFromDir(modelDir, baselines);
        }
      }
    }

    return baselines;
  }

  /**
   * Collect baselines from a directory
   */
  private collectBaselinesFromDir(dir: string, baselines: BaselineData[]): void {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const baseline = JSON.parse(content) as BaselineData;
          baselines.push(baseline);
        } catch (error) {
          console.warn(`Failed to load baseline ${file}:`, error);
        }
      }
    }
  }

  /**
   * Delete a baseline
   */
  deleteBaseline(adapter: AdapterType, model: string, scenarioId: string): boolean {
    const baselinePath = this.getBaselinePath(adapter, model, scenarioId);

    if (!fs.existsSync(baselinePath)) {
      return false;
    }

    try {
      fs.unlinkSync(baselinePath);
      return true;
    } catch (error) {
      console.warn(`Failed to delete baseline for ${scenarioId}:`, error);
      return false;
    }
  }

  /**
   * Delete all baselines for an adapter
   */
  deleteAllBaselines(adapter: AdapterType, model?: string): number {
    let count = 0;
    const adapterDir = path.join(this.baselineDir, adapter);

    if (!fs.existsSync(adapterDir)) {
      return 0;
    }

    if (model) {
      const modelDir = path.join(adapterDir, model);
      if (fs.existsSync(modelDir)) {
        const files = fs.readdirSync(modelDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              fs.unlinkSync(path.join(modelDir, file));
              count++;
            } catch (error) {
              console.warn(`Failed to delete ${file}:`, error);
            }
          }
        }
      }
    } else {
      // Delete all models
      const modelDirs = fs.readdirSync(adapterDir, { withFileTypes: true });
      for (const dir of modelDirs) {
        if (dir.isDirectory()) {
          const modelDir = path.join(adapterDir, dir.name);
          const files = fs.readdirSync(modelDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                fs.unlinkSync(path.join(modelDir, file));
                count++;
              } catch (error) {
                console.warn(`Failed to delete ${file}:`, error);
              }
            }
          }
        }
      }
    }

    return count;
  }
}
