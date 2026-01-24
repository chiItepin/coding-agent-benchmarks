/**
 * LLM-as-Judge validator using GitHub Models API
 */

import * as fs from "fs";
import * as path from "path";
import {
  CodeValidator,
  TestScenario,
  ValidationResult,
  Violation,
} from "../types";
import {
  resolveFilePaths,
  resolveWorkspaceRoot,
} from "../utils/workspaceUtils";
import { getGitHubToken } from "../utils/githubAuth";

/**
 * API response format from GitHub Models API
 */
interface LLMAPIResponse {
  evaluations: Array<{
    criterion: string;
    result: "PASS" | "FAIL" | "N/A";
    explanation: string;
  }>;
  overallScore: number;
  summary: string;
}

/**
 * Internal judgment format used by the validator
 */
interface LLMJudgment {
  passed: boolean;
  score: number;
  reasoning: string;
  violations?: Array<{
    message: string;
    file?: string;
    line?: number;
  }>;
}

const judgeSystemPrompt = `You are a code review judge evaluating whether generated code follows specific coding guidelines.

Your task is to evaluate the provided code against a set of criteria and return a JSON assessment.

Be strict but fair. Only mark criteria as FAIL if there is a clear violation.

Respond ONLY with valid JSON in this exact format:
{
  "evaluations": [
    {
      "criterion": "criterion text",
      "result": "PASS" | "FAIL" | "N/A",
      "explanation": "brief explanation"
    }
  ],
  "overallScore": 0.0 to 1.0,
  "summary": "one sentence summary"
}`;

export class LLMJudgeValidator implements CodeValidator {
  public readonly type = "llm-judge" as const;
  private workspaceRoot: string;
  private apiToken: string | undefined;
  private defaultModel: string;

  constructor(workspaceRoot?: string, model: string = "openai/gpt-4.1") {
    this.workspaceRoot = resolveWorkspaceRoot(workspaceRoot);
    this.apiToken = getGitHubToken(); // Auto-detect from env or GitHub CLI
    this.defaultModel = model;
  }

  /**
   * Validate generated code using LLM judgment
   */
  async validate(
    files: readonly string[],
    scenario: TestScenario,
  ): Promise<ValidationResult> {
    console.log("[LLM Judge] Starting validation for scenario:", scenario.id);
    const llmConfig = scenario.validationStrategy.llmJudge;
    console.log("[LLM Judge] Config:", JSON.stringify(llmConfig, null, 2));

    // If LLM judge not enabled, skip
    if (!llmConfig?.enabled) {
      console.log("[LLM Judge] SKIPPED: Not enabled in scenario config");
      return {
        passed: true,
        score: -1,
        violations: [],
        validatorType: "llm-judge",
      };
    }

    // If no API token, skip
    if (!this.apiToken) {
      console.log("[LLM Judge] SKIPPED: GITHUB_TOKEN not found");
      console.warn("GITHUB_TOKEN not found, skipping LLM judge validation");
      return {
        passed: true,
        score: -1,
        violations: [],
        validatorType: "llm-judge",
        error: "GITHUB_TOKEN not found",
      };
    }

    try {
      console.log("[LLM Judge] Reading generated files:", files);
      // Read all generated files
      const absolutePaths = resolveFilePaths(this.workspaceRoot, files);
      const fileContents: Array<{ path: string; content: string }> = [];

      for (const filePath of absolutePaths) {
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const content = fs.readFileSync(filePath, "utf-8");
        const relativePath = path.relative(this.workspaceRoot, filePath);
        fileContents.push({ path: relativePath, content });
      }

      // Build judgment prompt
      const judgmentPrompt = this.buildJudgmentPrompt(
        scenario,
        fileContents,
        llmConfig.judgmentPrompt,
      );
      console.log(
        "[LLM Judge] Built judgment prompt (length):",
        judgmentPrompt.length,
      );

      // Call LLM API
      const model = llmConfig.model || this.defaultModel;
      console.log("[LLM Judge] Calling API with model:", model);
      const judgment = await this.callLLMAPI(judgmentPrompt, model);
      console.log(
        "[LLM Judge] Received judgment:",
        JSON.stringify(judgment, null, 2),
      );

      // Convert judgment to violations
      const violations: Violation[] = (judgment.violations ?? []).map((v) => ({
        type: "llm-judge" as const,
        message: v.message,
        file: v.file,
        line: v.line,
        severity: scenario.severity,
        details: judgment.reasoning,
      }));

      const result = {
        passed: judgment.passed,
        score: judgment.score,
        violations,
        validatorType: "llm-judge",
      };
      console.log("[LLM Judge] Final result:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.log("[LLM Judge] ERROR:", error);
      return {
        passed: false,
        score: 0,
        violations: [],
        validatorType: "llm-judge",
        error: `LLM judge failed: ${error}`,
      };
    }
  }

  /**
   * Build the judgment prompt for the LLM
   */
  private buildJudgmentPrompt(
    scenario: TestScenario,
    fileContents: Array<{ path: string; content: string }>,
    customPrompt?: string,
  ): string {
    if (customPrompt) {
      return customPrompt;
    }

    const filesSection = fileContents
      .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    return `# Task Description
${scenario.description}

# Original Prompt Given to AI
${scenario.prompt}

# Generated Code
${filesSection}

# Evaluation Criteria
Evaluate whether the generated code:
1. Correctly implements the requirements from the prompt
2. Follows best practices for ${scenario.category}
3. Meets the quality standards for a ${scenario.severity} severity scenario

Be strict but fair in your evaluation.`;
  }

  /**
   * Call the GitHub Models API (or other LLM API)
   */
  private async callLLMAPI(
    prompt: string,
    model: string,
  ): Promise<LLMJudgment> {
    const apiUrl = "https://models.github.ai/inference/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: judgeSystemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub Models API error: ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in LLM response");
    }

    // Parse JSON response
    try {
      const apiResponse = JSON.parse(content) as LLMAPIResponse;

      // Validate API response structure
      if (
        !Array.isArray(apiResponse.evaluations) ||
        apiResponse.overallScore == null ||
        apiResponse.summary == null
      ) {
        throw new Error("Invalid judgment structure");
      }

      // Transform API response to internal judgment format
      // Extract violations from FAIL evaluations
      const violations = apiResponse.evaluations
        .filter((e) => e.result === "FAIL")
        .map((e) => ({
          message: `${e.criterion}: ${e.explanation}`,
        }));

      // Determine if passed based on violations and score threshold
      const passed = violations.length === 0 && apiResponse.overallScore >= 0.7;

      const judgment: LLMJudgment = {
        passed,
        score: Math.max(0, Math.min(1, apiResponse.overallScore)), // Ensure score is in valid range
        reasoning: apiResponse.summary,
        violations,
      };

      return judgment;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM response: ${error}\nContent: ${content}`,
      );
    }
  }

  /**
   * Test the LLM judge with a sample prompt (for debugging)
   */
  async testJudge(prompt: string, model?: string): Promise<string> {
    if (!this.apiToken) {
      return "Error: GITHUB_TOKEN not found";
    }

    try {
      const result = await this.callLLMAPI(prompt, model || this.defaultModel);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error}`;
    }
  }
}
