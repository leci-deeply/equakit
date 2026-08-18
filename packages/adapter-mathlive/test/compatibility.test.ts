import { describe, expect, it } from 'vitest';

import * as clipboard from '../src/clipboard.js';
import * as editor from '../src/index.js';

describe('@equakit/adapter-mathlive 兼容入口', () => {
  it('保留编辑器与 clipboard 子路径的运行时导出', () => {
    expect(Object.keys(editor).sort()).toEqual([
      'MathLiveFormulaEditor',
      'createMathLiveFormulaEditor',
    ]);
    expect(Object.keys(clipboard).sort()).toEqual([
      'createMathLiveClipboardConverter',
      'mathLiveClipboardConverter',
    ]);
  });
});
