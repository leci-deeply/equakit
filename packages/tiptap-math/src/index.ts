import type { AnyExtension, Editor } from '@tiptap/core';
import {
  BlockMath,
  InlineMath,
  createMathMigrateTransaction,
  mathMigrationRegex,
  migrateMathStrings,
} from '@tiptap/extension-mathematics';
import type { BlockMathOptions, InlineMathOptions } from '@tiptap/extension-mathematics';
import type { Transaction } from '@tiptap/pm/state';
import type { KatexOptions } from 'katex';

export type TipTapMathKatexOptions = Omit<
  KatexOptions,
  'displayMode' | 'strict' | 'throwOnError' | 'trust'
>;

export interface TipTapMathAdapterOptions {
  inlineOptions?: Omit<InlineMathOptions, 'katexOptions'> | false;
  blockOptions?: Omit<BlockMathOptions, 'katexOptions'> | false;
  katexOptions?: TipTapMathKatexOptions;
}

export const TIPTAP_MATH_CLIPBOARD_OPTIONS = Object.freeze({
  displayMathSelector: '[data-type="block-math"]',
  mathSourceAttribute: 'data-latex',
});

export const TIPTAP_MATH_NODE_NAMES = Object.freeze({
  inline: 'inlineMath',
  block: 'blockMath',
});

export const TIPTAP_MATH_DATA_TYPES = Object.freeze({
  inline: 'inline-math',
  block: 'block-math',
});

export const EQUAKIT_MATH_MIGRATION_REGEX =
  /(?<![\d$])\$(?!\d+(?:[.,]\d+)?\$)([^$\n]+?)\$(?![\d$])/g;

export function createTipTapMathExtensions(options: TipTapMathAdapterOptions = {}): AnyExtension[] {
  const extensions: AnyExtension[] = [];

  if (options.inlineOptions !== false) {
    extensions.push(
      InlineMath.configure({
        ...(options.inlineOptions ?? {}),
        katexOptions: createSafeKatexOptions(options.katexOptions, false),
      }),
    );
  }

  if (options.blockOptions !== false) {
    extensions.push(
      BlockMath.configure({
        ...(options.blockOptions ?? {}),
        katexOptions: createSafeKatexOptions(options.katexOptions, true),
      }),
    );
  }

  return extensions;
}

export function createEquaKitMathMigrateTransaction(editor: Editor, tr: Transaction) {
  return createMathMigrateTransaction(editor, tr, cloneMigrationRegex());
}

export function migrateEquaKitMathStrings(editor: Editor) {
  return migrateMathStrings(editor, cloneMigrationRegex());
}

function cloneMigrationRegex() {
  return new RegExp(EQUAKIT_MATH_MIGRATION_REGEX.source, EQUAKIT_MATH_MIGRATION_REGEX.flags);
}

function createSafeKatexOptions(
  options: TipTapMathKatexOptions | undefined,
  displayMode: boolean,
): KatexOptions {
  return {
    ...options,
    displayMode,
    strict: 'ignore',
    throwOnError: false,
    trust: false,
  };
}

export {
  BlockMath,
  InlineMath,
  createMathMigrateTransaction,
  mathMigrationRegex,
  migrateMathStrings,
};
export type { BlockMathOptions, InlineMathOptions };
