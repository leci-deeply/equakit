import {
  extractMathTokens,
  normalizeLatexExpression,
  normalizeMarkdownMath,
} from '@equakit/math-text';
import { renderToString as katexRenderToString } from 'katex';
import type { KatexOptions } from 'katex';

export interface MathValidationIssue {
  kind: 'latex' | 'delimiter';
  message: string;
  expression?: string;
  display?: boolean;
  start?: number;
  end?: number;
}

export interface MathValidationResult {
  ok: boolean;
  normalized: string;
  issues: MathValidationIssue[];
}

export interface LatexRenderOptions {
  displayMode: boolean;
  throwOnError: boolean;
  strict: 'ignore';
}

export type LatexRenderer = (expression: string, options: LatexRenderOptions) => unknown;
export type SafeKatexRenderOptions = Omit<KatexOptions, 'trust'> & { trust?: false };

export function renderLatexToString(
  expression: string,
  options: SafeKatexRenderOptions = {},
): string {
  return katexRenderToString(expression, { ...options, trust: false });
}

export function validateLatexExpression(
  expression: string,
  options: { display?: boolean; renderToString?: LatexRenderer } = {},
): MathValidationResult {
  const normalized = normalizeLatexExpression(expression);
  const issues = normalized
    ? validateKatex(normalized, Boolean(options.display), options.renderToString)
    : [];
  return { ok: issues.length === 0, normalized, issues };
}

export function validateMarkdownMath(
  source: string,
  options: { renderToString?: LatexRenderer } = {},
): MathValidationResult {
  const normalized = normalizeMarkdownMath(source);
  const issues: MathValidationIssue[] = [...findDelimiterIssues(normalized)];

  for (const token of extractMathTokens(normalized)) {
    issues.push(
      ...validateKatex(
        token.expression,
        token.display,
        options.renderToString,
        token.start,
        token.end,
      ),
    );
  }

  return { ok: issues.length === 0, normalized, issues };
}

export function defaultKatexRenderer(expression: string, options: LatexRenderOptions): unknown {
  return renderLatexToString(expression, options);
}

function validateKatex(
  expression: string,
  display: boolean,
  renderToString?: LatexRenderer,
  start?: number,
  end?: number,
): MathValidationIssue[] {
  const renderer = renderToString ?? defaultKatexRenderer;
  try {
    renderer(expression, {
      displayMode: display,
      throwOnError: true,
      strict: 'ignore',
    });
    return [];
  } catch (error) {
    const issue: MathValidationIssue = {
      kind: 'latex',
      message: error instanceof Error ? error.message : 'KaTeX 解析错误',
      expression,
      display,
    };
    if (start !== undefined) issue.start = start;
    if (end !== undefined) issue.end = end;
    return [issue];
  }
}

function findDelimiterIssues(source: string): MathValidationIssue[] {
  const issues: MathValidationIssue[] = [];
  const singleDollars = [...source.matchAll(/(?<!\\)\$/g)].filter((match) => {
    const index = match.index ?? 0;
    return source.slice(index, index + 2) !== '$$' && source.slice(index - 1, index + 1) !== '$$';
  });

  if (singleDollars.length % 2 === 1) {
    issues.push({
      kind: 'delimiter',
      message: '行内数学分隔符不成对。',
    });
  }

  for (const pattern of [
    { open: /(?<!\\)\\\(/g, close: /(?<!\\)\\\)/g, label: '\\(...\\)' },
    { open: /(?<!\\)\\\[/g, close: /(?<!\\)\\\]/g, label: '\\[...\\]' },
  ]) {
    const opens = countMatches(source, pattern.open);
    const closes = countMatches(source, pattern.close);
    if (opens !== closes) {
      issues.push({
        kind: 'delimiter',
        message: `${pattern.label} 分隔符不成对。`,
      });
    }
  }

  return issues;
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}
