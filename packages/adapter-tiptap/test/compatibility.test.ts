import { describe, expect, it } from 'vitest';

import * as adapter from '../src/index.js';

const legacyRuntimeExports = [
  'BlockMath',
  'EQUAKIT_MATH_MIGRATION_REGEX',
  'InlineMath',
  'TIPTAP_MATH_CLIPBOARD_OPTIONS',
  'TIPTAP_MATH_DATA_TYPES',
  'TIPTAP_MATH_NODE_NAMES',
  'createEquaKitMathMigrateTransaction',
  'createMathMigrateTransaction',
  'createTipTapMathExtensions',
  'mathMigrationRegex',
  'migrateEquaKitMathStrings',
  'migrateMathStrings',
] as const;

describe('@equakit/adapter-tiptap 兼容入口', () => {
  it('完整保留重构前的运行时导出', () => {
    expect(Object.keys(adapter).sort()).toEqual([...legacyRuntimeExports].sort());
  });
});
