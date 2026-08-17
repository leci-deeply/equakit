import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { KatexOptions } from 'katex';

import {
  EQUAKIT_MATH_MIGRATION_REGEX,
  TIPTAP_MATH_CLIPBOARD_OPTIONS,
  TIPTAP_MATH_DATA_TYPES,
  TIPTAP_MATH_NODE_NAMES,
  createTipTapMathExtensions,
} from '../src/index.js';

describe('@equakit/adapter-tiptap', () => {
  it('注册 inlineMath 和 blockMath 节点并保留 LaTeX HTML 属性', () => {
    const schema = getSchema([StarterKit, ...createTipTapMathExtensions()]);
    const inlineNode = schema.nodes.inlineMath?.create({ latex: 'x^2+1' });
    const blockNode = schema.nodes.blockMath?.create({ latex: '\\int_0^1 x\\,dx' });

    expect(inlineNode?.toJSON()).toEqual({
      type: 'inlineMath',
      attrs: { latex: 'x^2+1' },
    });
    expect(blockNode?.toJSON()).toEqual({
      type: 'blockMath',
      attrs: { latex: '\\int_0^1 x\\,dx' },
    });
    expect(schema.nodes.inlineMath?.spec.toDOM?.(inlineNode!)).toEqual([
      'span',
      { 'data-latex': 'x^2+1', 'data-type': 'inline-math' },
    ]);
    expect(schema.nodes.blockMath?.spec.toDOM?.(blockNode!)).toEqual([
      'div',
      { 'data-latex': '\\int_0^1 x\\,dx', 'data-type': 'block-math' },
    ]);
  });

  it('分别固定 inline/block displayMode 并强制安全 KaTeX 默认值', () => {
    const [inlineMath, blockMath] = createTipTapMathExtensions({
      katexOptions: { macros: { '\\R': '\\mathbb{R}' } },
    });
    const inlineKatex = getKatexOptions(inlineMath?.options);
    const blockKatex = getKatexOptions(blockMath?.options);

    expect(inlineKatex).toMatchObject({
      displayMode: false,
      strict: 'ignore',
      throwOnError: false,
      trust: false,
    });
    expect(blockKatex).toMatchObject({
      displayMode: true,
      strict: 'ignore',
      throwOnError: false,
      trust: false,
    });
    expect(inlineKatex.macros).toEqual({ '\\R': '\\mathbb{R}' });
  });

  it('允许按需关闭 inline 或 block 节点', () => {
    expect(createTipTapMathExtensions({ inlineOptions: false }).map(({ name }) => name)).toEqual([
      'blockMath',
    ]);
    expect(createTipTapMathExtensions({ blockOptions: false }).map(({ name }) => name)).toEqual([
      'inlineMath',
    ]);
  });

  it('提供迁移正则和 EquaKit 剪贴板源码属性', () => {
    const matches = Array.from('价格 $100$，公式 $x^2+1$。'.matchAll(EQUAKIT_MATH_MIGRATION_REGEX));

    expect(matches.map(([match]) => match)).toEqual(['$x^2+1$']);
    expect(TIPTAP_MATH_CLIPBOARD_OPTIONS).toEqual({
      displayMathSelector: '[data-type="block-math"]',
      mathSourceAttribute: 'data-latex',
    });
    expect(TIPTAP_MATH_NODE_NAMES).toEqual({ inline: 'inlineMath', block: 'blockMath' });
    expect(TIPTAP_MATH_DATA_TYPES).toEqual({ inline: 'inline-math', block: 'block-math' });
  });
});

function getKatexOptions(options: unknown): KatexOptions {
  return (options as { katexOptions?: KatexOptions }).katexOptions ?? {};
}
