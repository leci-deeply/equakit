import { extractMathTokens, normalizeMarkdownMath } from '@equakit/math-text';

export const MATH_CLIPBOARD_MIME_TYPES = Object.freeze({
  plainText: 'text/plain',
  latex: 'application/x-latex',
  mathml: 'application/mathml+xml',
  asciimath: 'text/asciimath',
  mathjson: 'application/vnd.equakit.mathjson+json',
});

export interface MathClipboardFormatConverter {
  toMathML?: (latex: string) => string | null | undefined;
  toAsciiMath?: (latex: string) => string | null | undefined;
  toMathJSON?: (latex: string) => unknown;
}

export type MathClipboardPayload = Record<string, string>;

export function createMathClipboardPayload(
  plainText: string,
  converter?: MathClipboardFormatConverter,
): MathClipboardPayload {
  const payload: MathClipboardPayload = {
    [MATH_CLIPBOARD_MIME_TYPES.plainText]: plainText,
  };
  const latex = extractSingleLatexExpression(plainText);
  if (!latex) return payload;

  payload[MATH_CLIPBOARD_MIME_TYPES.latex] = latex;
  addStringFormat(payload, MATH_CLIPBOARD_MIME_TYPES.mathml, converter?.toMathML, latex);
  addStringFormat(payload, MATH_CLIPBOARD_MIME_TYPES.asciimath, converter?.toAsciiMath, latex);
  addMathJsonFormat(payload, converter?.toMathJSON, latex);
  return payload;
}

export function extractSingleLatexExpression(value: string): string | null {
  const normalized = normalizeMarkdownMath(value);
  const tokens = extractMathTokens(normalized);
  if (tokens.length !== 1) return null;

  const token = tokens[0];
  if (!token) return null;
  const remaining = `${normalized.slice(0, token.start)}${normalized.slice(token.end)}`.trim();
  return remaining ? null : token.expression.trim() || null;
}

function addStringFormat(
  payload: MathClipboardPayload,
  mimeType: string,
  convert: ((latex: string) => string | null | undefined) | undefined,
  latex: string,
) {
  if (!convert) return;
  try {
    const value = convert(latex)?.trim();
    if (value) payload[mimeType] = value;
  } catch {
    // 单个可选格式转换失败时保留 text/plain 和其他已成功格式。
  }
}

function addMathJsonFormat(
  payload: MathClipboardPayload,
  convert: ((latex: string) => unknown) | undefined,
  latex: string,
) {
  if (!convert) return;
  try {
    const value = convert(latex);
    if (value === undefined) return;
    const serialized = JSON.stringify(value);
    if (serialized) payload[MATH_CLIPBOARD_MIME_TYPES.mathjson] = serialized;
  } catch {
    // MathJSON 转换或序列化失败时不阻断其他剪贴板格式。
  }
}
