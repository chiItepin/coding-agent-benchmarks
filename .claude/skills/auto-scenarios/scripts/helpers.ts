/**
 * Helper utilities for the auto-scenarios skill
 * These functions can be used by the skill to parse and generate scenarios
 */

export interface CodeStandard {
  source: string;
  ruleId: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'typescript' | 'react' | 'testing' | 'architecture' | 'performance' | 'general';
  rawText: string;
}

export interface ProjectInfo {
  language: string;
  framework?: string;
  projectType: string;
  purpose: string;
  hasTsConfig: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
}

/**
 * Common regex patterns for extracting standards from markdown
 */
export const STANDARD_PATTERNS = {
  noPattern: /No `(\w+)`/gi,
  preferPattern: /Prefer (\w+(?:\s+\w+)*) over ([^\n.]+)/gi,
  avoidPattern: /Avoid ([^\n.]+[^.\n])/gi,
  usePattern: /Use (?:the )?(\w+(?:\s+\w+)*) (?:for|when|to) ([^\n.]+)/gi,
  mustPattern: /(?:Must|Should|Always) ([^\n.]+[^.\n])/gi,
  neverPattern: /Never ([^\n.]+[^.\n])/gi,
};

/**
 * Severity classification based on keywords
 */
export const classifySeverity = (text: string): 'critical' | 'major' | 'minor' => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('must') || lowerText.includes('critical') || lowerText.includes('never')) {
    return 'critical';
  }

  if (lowerText.includes('should') || lowerText.includes('important') || lowerText.includes('avoid')) {
    return 'major';
  }

  return 'minor';
};

/**
 * Category classification based on keywords
 */
export const classifyCategory = (text: string): CodeStandard['category'] => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('typescript') || lowerText.includes('type') || lowerText.includes('interface')) {
    return 'typescript';
  }

  if (lowerText.includes('react') || lowerText.includes('component') || lowerText.includes('jsx')) {
    return 'react';
  }

  if (lowerText.includes('test') || lowerText.includes('coverage')) {
    return 'testing';
  }

  if (lowerText.includes('architecture') || lowerText.includes('pattern') || lowerText.includes('responsibility')) {
    return 'architecture';
  }

  if (lowerText.includes('performance') || lowerText.includes('optimization')) {
    return 'performance';
  }

  return 'general';
};

/**
 * Generate a kebab-case ID from a description
 */
export const generateRuleId = (description: string): string => {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
};

/**
 * Escape special characters for JavaScript string literals
 */
export const escapeForJS = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${')
    .replace(/\n/g, '\\n');
};

/**
 * Format a RegExp for JavaScript code output
 */
export const formatRegex = (regex: RegExp): string => {
  return regex.toString();
};
