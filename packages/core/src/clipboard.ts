import { isFormulaShapedLatexLine } from './math.js';

export interface RichClipboardOptions {
  mathSourceAttribute?: string;
  decodeMathSource?: (value: string) => string | null | undefined;
  excludeSelector?: string;
  displayMathSelector?: string;
}

const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'BLOCKQUOTE',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'UL',
]);

const LIST_TAGS = new Set(['LI']);
const LATEX_COMMAND =
  /\\(?:displaystyle|limits|lim|limsup|liminf|frac|dfrac|sqrt|sin|cos|tan|cot|ln|log|arctan|int|sum|prod|infty|to|left|right|begin|end|cdot|times|le|ge|ne|pm|mp|mathrm|text|operatorname)(?![a-zA-Z])/;
const CJK = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u;
const DELIMITED_MATH = /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
const DEFAULT_MATH_SOURCE_ATTRIBUTE = 'data-math-source';
const DEFAULT_EXCLUDE_SELECTOR = 'script,style,[data-rich-copy-exclude="true"],.katex-mathml';
const SAFE_ATTRIBUTE_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;

export function normalizeClipboardText(text: string): string {
  const normalized = text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized.split('\n').map(normalizeLooseLatexLine).join('\n');
}

export function normalizeLooseLatexLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || CJK.test(trimmed)) return line;

  const outsideDelimitedMath = trimmed.replace(DELIMITED_MATH, '');
  if (
    !LATEX_COMMAND.test(outsideDelimitedMath) ||
    !isFormulaShapedLatexLine(outsideDelimitedMath)
  ) {
    return line;
  }

  const latex = trimmed
    .replace(/\$\$/g, '')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .trim();
  return latex ? `\\(${latex}\\)` : line;
}

export function richHtmlToMarkdown(
  html: string,
  plainText = '',
  options: RichClipboardOptions = {},
): string {
  if (!html.trim() || typeof DOMParser === 'undefined') return normalizeClipboardText(plainText);

  try {
    const document = new DOMParser().parseFromString(html, 'text/html');
    return richDomToMarkdown(document.body, plainText, options);
  } catch {
    return normalizeClipboardText(plainText);
  }
}

export function richDomToMarkdown(
  root: ParentNode,
  plainText = '',
  options: RichClipboardOptions = {},
): string {
  try {
    return serializeRichDom(root, undefined, options) || normalizeClipboardText(plainText);
  } catch {
    return normalizeClipboardText(plainText);
  }
}

export function richSelectionToMarkdown(
  range: Range,
  source: ParentNode,
  plainText = '',
  options: RichClipboardOptions = {},
): string {
  try {
    return serializeRichDom(source, range, options) || normalizeClipboardText(plainText);
  } catch {
    return normalizeClipboardText(plainText);
  }
}

function serializeRichDom(
  root: ParentNode,
  range: Range | undefined,
  options: RichClipboardOptions,
): string {
  const chunks: string[] = [];
  const marker = normalizeMathSourceAttribute(options.mathSourceAttribute);
  const excludeSelector = options.excludeSelector ?? DEFAULT_EXCLUDE_SELECTOR;

  const appendNewline = () => {
    if (chunks.length > 0 && chunks[chunks.length - 1] !== '\n') chunks.push('\n');
  };

  const appendSpace = () => {
    const last = chunks[chunks.length - 1] ?? '';
    if (last && !/[\s\n]$/.test(last)) chunks.push(' ');
  };

  const visit = (node: Node) => {
    if (range) {
      try {
        if (!range.intersectsNode(node)) return;
      } catch {
        return;
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.nodeValue ?? '';
      const start = node === range?.startContainer ? range.startOffset : 0;
      const end = node === range?.endContainer ? range.endOffset : value.length;
      if (end > start) chunks.push(value.slice(start, end));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (matchesExcludeSelector(element, excludeSelector)) return;

    if (element.tagName === 'BR') {
      appendNewline();
      return;
    }

    if (element.matches('strong,b')) {
      chunks.push('**');
      element.childNodes.forEach(visit);
      chunks.push('**');
      return;
    }

    if (element.matches('em,i')) {
      chunks.push('*');
      element.childNodes.forEach(visit);
      chunks.push('*');
      return;
    }

    if (isFormulaElement(element, marker)) {
      const latex = latexFromElement(element, marker, options.decodeMathSource);
      if (latex) {
        const display = matchesDisplayMathSelector(element, options.displayMathSelector);
        if (display) appendNewline();
        chunks.push(display ? `\\[${latex}\\]` : `\\(${latex}\\)`);
        if (display) appendNewline();
        return;
      }
    }

    const block = BLOCK_TAGS.has(element.tagName);
    if (block) appendNewline();
    if (LIST_TAGS.has(element.tagName)) chunks.push('- ');

    element.childNodes.forEach(visit);

    if (element.matches('td,th')) appendSpace();
    if (block) appendNewline();
  };

  root.childNodes.forEach(visit);
  return normalizeClipboardText(chunks.join(''));
}

function isFormulaElement(element: Element, marker: string): boolean {
  return (
    element.hasAttribute(marker) ||
    element.matches('.katex,math,annotation[encoding="application/x-tex"]')
  );
}

function latexFromElement(
  element: Element,
  marker: string,
  decodeMathSource: RichClipboardOptions['decodeMathSource'],
): string | null {
  const marked = element.hasAttribute(marker) ? element : element.querySelector(`[${marker}]`);
  const markerValue = marked?.getAttribute(marker);
  const decoded = markerValue == null ? null : decodeMarker(markerValue, decodeMathSource);
  if (decoded) return decoded;

  const annotation = element.matches('annotation[encoding="application/x-tex"]')
    ? element
    : element.querySelector('annotation[encoding="application/x-tex"]');
  return annotation?.textContent?.trim() || null;
}

function decodeMarker(
  value: string,
  decodeMathSource: RichClipboardOptions['decodeMathSource'],
): string | null {
  const decoded = decodeMathSource ? decodeMathSource(value) : value;
  const text = decoded?.trim();
  return text || null;
}

function normalizeMathSourceAttribute(value: string | undefined): string {
  const marker = value ?? DEFAULT_MATH_SOURCE_ATTRIBUTE;
  return SAFE_ATTRIBUTE_NAME.test(marker) ? marker : DEFAULT_MATH_SOURCE_ATTRIBUTE;
}

function matchesExcludeSelector(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return element.matches(DEFAULT_EXCLUDE_SELECTOR);
  }
}

function matchesDisplayMathSelector(element: Element, selector: string | undefined): boolean {
  if (!selector) return false;
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}
