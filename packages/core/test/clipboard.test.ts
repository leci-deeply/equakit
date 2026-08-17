import { describe, expect, it, vi } from 'vitest';

import { normalizeClipboardText, normalizeLooseLatexLine, richDomToMarkdown } from '../src';

class TextNode {
  readonly nodeType = 3;

  constructor(readonly nodeValue: string) {}
}

class ElementNode {
  readonly nodeType = 1;
  readonly childNodes: Array<ElementNode | TextNode>;
  readonly attributes = new Map<string, string>();
  textContent = '';

  constructor(
    readonly tagName: string,
    children: Array<ElementNode | TextNode> = [],
    attributes: Record<string, string> = {},
  ) {
    this.childNodes = children;
    for (const [key, value] of Object.entries(attributes)) this.attributes.set(key, value);
    this.textContent = children.map((child) => child.nodeValue ?? child.textContent).join('');
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  matches(selector: string): boolean {
    return selector.split(',').some((part) => this.matchesOne(part.trim()));
  }

  querySelector(selector: string): ElementNode | null {
    for (const child of this.childNodes) {
      if (child instanceof ElementNode) {
        if (child.matches(selector)) return child;
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
    }
    return null;
  }

  private matchesOne(selector: string): boolean {
    if (selector === '') return false;
    if (selector.startsWith('[') && selector.endsWith(']')) {
      const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (!match?.[1]) return false;
      return match[2] === undefined
        ? this.hasAttribute(match[1])
        : this.getAttribute(match[1]) === match[2];
    }
    if (selector.startsWith('.')) return false;
    if (selector === 'strong' || selector === 'b') return ['STRONG', 'B'].includes(this.tagName);
    if (selector === 'em' || selector === 'i') return ['EM', 'I'].includes(this.tagName);
    if (selector === 'annotation[encoding="application/x-tex"]') {
      return this.tagName === 'ANNOTATION' && this.getAttribute('encoding') === 'application/x-tex';
    }
    return selector.toUpperCase() === this.tagName;
  }
}

const text = (value: string) => new TextNode(value);
const element = (
  tagName: string,
  children: Array<ElementNode | TextNode> = [],
  attributes: Record<string, string> = {},
) => new ElementNode(tagName.toUpperCase(), children, attributes);

describe('剪贴板恢复', () => {
  it('归一化空白并包裹松散的 LaTeX 行', () => {
    expect(normalizeClipboardText('  A\u00a0\u00a0B \n\n\n \\frac{1}{2}  ')).toBe(
      'A B\n\n\\(\\frac{1}{2}\\)',
    );
    expect(normalizeLooseLatexLine('含中文 \\frac{1}{2}')).toBe('含中文 \\frac{1}{2}');
    expect(normalizeLooseLatexLine('Area is \\frac{1}{2} of the total')).toBe(
      'Area is \\frac{1}{2} of the total',
    );
  });

  it('从渲染后的 DOM 恢复 Markdown 和带标记的公式源码', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('div', [
      element('p', [
        text('使用 '),
        element('strong', [text('加粗')]),
        text(' 和 '),
        element('span', [], { 'data-math-source': '\\frac{a}{b}' }),
        text('.'),
      ]),
      element('ul', [element('li', [text('第一项')]), element('li', [text('第二项')])]),
    ]);

    expect(richDomToMarkdown(root as unknown as ParentNode)).toBe(
      '使用 **加粗** 和 \\(\\frac{a}{b}\\).\n- 第一项\n- 第二项',
    );
  });

  it('支持自定义数学源码属性和解码器', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('div', [
      element('span', [], {
        'data-latex': encodeURIComponent('\\sqrt{x}'),
      }),
    ]);

    expect(
      richDomToMarkdown(root as unknown as ParentNode, '', {
        mathSourceAttribute: 'data-latex',
        decodeMathSource: decodeURIComponent,
      }),
    ).toBe('\\(\\sqrt{x}\\)');
  });

  it('配置无效时回退到安全标记和默认排除规则', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const hidden = element('script', [text('私有内容')]);
    const originalMatches = hidden.matches.bind(hidden);
    hidden.matches = (selector: string) => {
      if (selector === '[') throw new DOMException('选择器无效');
      return originalMatches(selector);
    };
    const root = element('div', [element('span', [], { 'data-math-source': 'x^2' }), hidden]);

    expect(
      richDomToMarkdown(root as unknown as ParentNode, '', {
        mathSourceAttribute: 'data-bad] span',
        excludeSelector: '[',
      }),
    ).toBe('\\(x^2\\)');
  });

  it('回退读取 MathML TeX annotation', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('math', [
      element('semantics', [
        element('annotation', [text('x^2')], { encoding: 'application/x-tex' }),
      ]),
    ]);

    expect(richDomToMarkdown(root as unknown as ParentNode)).toBe('\\(x^2\\)');
  });

  it('按可选 selector 保留块级公式分隔符', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('div', [
      element('span', [], { 'data-latex': 'x^2' }),
      element('div', [], { 'data-latex': '\\sum_i i', 'data-type': 'block-math' }),
    ]);

    expect(
      richDomToMarkdown(root as unknown as ParentNode, '', {
        displayMathSelector: '[data-type="block-math"]',
        mathSourceAttribute: 'data-latex',
      }),
    ).toBe('\\(x^2\\)\n\\[\\sum_i i\\]');
  });
});
