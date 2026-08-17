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
      return this.hasAttribute(selector.slice(1, -1));
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

describe('clipboard recovery', () => {
  it('normalizes whitespace and wraps loose LaTeX lines', () => {
    expect(normalizeClipboardText('  A\u00a0\u00a0B \n\n\n \\frac{1}{2}  ')).toBe(
      'A B\n\n\\(\\frac{1}{2}\\)',
    );
    expect(normalizeLooseLatexLine('含中文 \\frac{1}{2}')).toBe('含中文 \\frac{1}{2}');
    expect(normalizeLooseLatexLine('Area is \\frac{1}{2} of the total')).toBe(
      'Area is \\frac{1}{2} of the total',
    );
  });

  it('recovers Markdown and marked formula sources from rendered DOM', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('div', [
      element('p', [
        text('Use '),
        element('strong', [text('bold')]),
        text(' and '),
        element('span', [], { 'data-math-source': '\\frac{a}{b}' }),
        text('.'),
      ]),
      element('ul', [element('li', [text('first')]), element('li', [text('second')])]),
    ]);

    expect(richDomToMarkdown(root as unknown as ParentNode)).toBe(
      'Use **bold** and \\(\\frac{a}{b}\\).\n- first\n- second',
    );
  });

  it('supports custom math source attributes and decoders', () => {
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

  it('falls back to safe marker and exclusion defaults for invalid configuration', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const hidden = element('script', [text('private payload')]);
    const originalMatches = hidden.matches.bind(hidden);
    hidden.matches = (selector: string) => {
      if (selector === '[') throw new DOMException('Invalid selector');
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

  it('falls back to MathML TeX annotations', () => {
    vi.stubGlobal('Node', { TEXT_NODE: 3, ELEMENT_NODE: 1 });

    const root = element('math', [
      element('semantics', [
        element('annotation', [text('x^2')], { encoding: 'application/x-tex' }),
      ]),
    ]);

    expect(richDomToMarkdown(root as unknown as ParentNode)).toBe('\\(x^2\\)');
  });
});
