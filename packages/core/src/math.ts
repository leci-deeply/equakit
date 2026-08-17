import { renderToString as katexRenderToString } from 'katex';

export type MathDelimiter = '$' | '$$' | '\\(' | '\\)' | '\\[' | '\\]';

export interface MathToken {
  expression: string;
  display: boolean;
  start: number;
  end: number;
  delimiter: '$' | '$$';
}

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

const LIMIT_OPERATORS =
  /\\(lim|limsup|liminf|varlimsup|varliminf|sup|inf|max|min|det|gcd|Pr|injlim|projlim)(?![a-zA-Z])(?!\s*\\(?:no)?limits)/g;

const SPLIT_FRACTION_EXPONENT = /\^\{\\frac\{([^{}\n]+)\}\}\{([^{}\n]+)\}/g;

const LATEX_COMMAND_LINE =
  /\\(?:displaystyle|limits|lim|limsup|liminf|frac|dfrac|sqrt|sin|cos|tan|cot|ln|log|arctan|int|sum|prod|alpha|beta|gamma|theta|lambda|mu|pi|sigma|varphi|phi|omega|infty|to|left|right|begin|end|cdot|times|le|ge|ne|pm|mp|mathrm|text|operatorname)(?![a-zA-Z])/;

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u;
const DISPLAY_DELIMITER = /\$|(?<!\\)\\[([]/;

export function isFormulaShapedLatexLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || CJK.test(trimmed) || !LATEX_COMMAND_LINE.test(trimmed)) return false;
  if (/^\\[A-Za-z]+/.test(trimmed)) return true;

  const outsideCommands = trimmed.replace(/\\[A-Za-z]+/g, ' ');
  const proseWords = outsideCommands.match(/[A-Za-z]{2,}/g) ?? [];
  if (proseWords.length > 0) return false;
  return /[=+\-*/^_{}()[\]<>]|\\/.test(trimmed);
}

export function stripMathDelimiters(input: string): string {
  let text = input.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const [open, close] of [
      ['$$', '$$'],
      ['\\[', '\\]'],
      ['\\(', '\\)'],
      ['$', '$'],
    ] as const) {
      if (
        text.startsWith(open) &&
        text.endsWith(close) &&
        text.length >= open.length + close.length
      ) {
        text = text.slice(open.length, text.length - close.length).trim();
        changed = true;
      }
    }
  }

  return text;
}

export function normalizeLatexExpression(input: string): string {
  return stripMathDelimiters(input)
    .replace(SPLIT_FRACTION_EXPONENT, (_match, numerator: string, denominator: string) => {
      return `^{\\frac{${numerator.trim()}}{${denominator.trim()}}}`;
    })
    .replace(LIMIT_OPERATORS, (match) => `${match}\\limits`)
    .trim();
}

export function normalizeMarkdownMath(source: string): string {
  return wrapBareLatexLines(source)
    .replace(SPLIT_FRACTION_EXPONENT, (_match, numerator: string, denominator: string) => {
      return `^{\\frac{${numerator.trim()}}{${denominator.trim()}}}`;
    })
    .replace(LIMIT_OPERATORS, (match) => `${match}\\limits`)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_match, body: string) => `$$${body}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_match, body: string) => `$${body}$`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, body: string) => `\n\n$$\n${body.trim()}\n$$\n\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

export function extractMathTokens(source: string): MathToken[] {
  const tokens: MathToken[] = [];
  let index = 0;

  while (index < source.length) {
    const displayStart = source.indexOf('$$', index);
    const inlineStart = findNextInlineDollar(source, index);
    const nextStart = minPositive(displayStart, inlineStart);
    if (nextStart < 0) break;

    const display = displayStart === nextStart;
    const delimiter = display ? '$$' : '$';
    const bodyStart = nextStart + delimiter.length;
    const end = display ? source.indexOf('$$', bodyStart) : findNextInlineDollar(source, bodyStart);
    if (end < 0) break;

    const expression = source.slice(bodyStart, end).trim();
    if (expression) {
      tokens.push({
        expression,
        display,
        delimiter,
        start: nextStart,
        end: end + delimiter.length,
      });
    }
    index = end + delimiter.length;
  }

  return tokens;
}

export type LatexRenderer = (
  expression: string,
  options: { displayMode: boolean; throwOnError: boolean; strict: 'ignore' },
) => unknown;

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

function defaultKatexRenderer(
  expression: string,
  options: { displayMode: boolean; throwOnError: boolean; strict: 'ignore' },
): unknown {
  return katexRenderToString(expression, options);
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

function wrapBareLatexLines(source: string): string {
  let displayDelimiter: '$$' | '\\[' | null = null;
  let environmentLines: string[] | null = null;
  const environmentStack: string[] = [];
  const output: string[] = [];

  const updateEnvironmentStack = (line: string) => {
    for (const match of line.matchAll(/\\(begin|end)\{([^{}\n]+)\}/g)) {
      const [, command, name] = match;
      if (!name) continue;
      if (command === 'begin') {
        environmentStack.push(name);
      } else if (environmentStack.at(-1) === name) {
        environmentStack.pop();
      }
    }
  };

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (environmentLines) {
      environmentLines.push(line);
      updateEnvironmentStack(line);
      if (environmentStack.length === 0) {
        output.push(`$$\n${environmentLines.join('\n').trim()}\n$$`);
        environmentLines = null;
      }
      continue;
    }

    if (trimmed === '$$') {
      displayDelimiter = displayDelimiter == null ? '$$' : null;
      output.push(line);
      continue;
    }

    if (trimmed === '\\[' && displayDelimiter == null) {
      displayDelimiter = '\\[';
      output.push(line);
      continue;
    }

    if (trimmed === '\\]' && displayDelimiter === '\\[') {
      displayDelimiter = null;
      output.push(line);
      continue;
    }

    if (
      displayDelimiter == null &&
      isFormulaShapedLatexLine(trimmed) &&
      hasUnclosedDollarDelimiter(trimmed)
    ) {
      const repaired = trimmed.replace(/\$\$/g, '').replace(/\$/g, '').trim();
      output.push(`$$\n${repaired}\n$$`);
      continue;
    }

    if (
      displayDelimiter == null &&
      /\\begin\{[^{}\n]+\}/.test(trimmed) &&
      !DISPLAY_DELIMITER.test(trimmed) &&
      !CJK.test(trimmed)
    ) {
      environmentLines = [line];
      updateEnvironmentStack(line);
      if (environmentStack.length === 0) {
        output.push(`$$\n${trimmed}\n$$`);
        environmentLines = null;
      }
      continue;
    }

    if (
      displayDelimiter != null ||
      !trimmed ||
      !isFormulaShapedLatexLine(trimmed) ||
      DISPLAY_DELIMITER.test(trimmed) ||
      CJK.test(trimmed)
    ) {
      output.push(line);
      continue;
    }

    output.push(`$$\n${trimmed}\n$$`);
  }

  if (environmentLines) output.push(...environmentLines);
  return output.join('\n');
}

function hasUnclosedDollarDelimiter(line: string): boolean {
  const withoutDouble = line.replace(/\$\$/g, '');
  const doubleCount = (line.length - withoutDouble.length) / 2;
  const singleCount = (withoutDouble.match(/\$/g) ?? []).length;
  return doubleCount % 2 === 1 || singleCount % 2 === 1;
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function findNextInlineDollar(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] !== '$') continue;
    if (source[index - 1] === '\\') continue;
    if (source[index + 1] === '$' || source[index - 1] === '$') continue;
    return index;
  }
  return -1;
}

function minPositive(a: number, b: number): number {
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}
