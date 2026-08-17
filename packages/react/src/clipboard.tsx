import { useCallback } from 'react';
import type { ClipboardEvent, ReactNode } from 'react';

import {
  normalizeClipboardText as normalizeCoreClipboardText,
  richDomToMarkdown,
  richSelectionToMarkdown,
  type RichClipboardOptions,
} from '@equakit/core';

export interface MathClipboardSerializerInput {
  root: ParentNode;
  plainText?: string;
  range?: Range;
  options?: RichClipboardOptions;
}

export type MathClipboardSerializer = (input: MathClipboardSerializerInput) => string;

export interface CoreMathSerializationModule {
  serializeRenderedMath?: MathClipboardSerializer;
  serializeSelection?: MathClipboardSerializer;
}

export interface UseMathClipboardOptions {
  serializer?: MathClipboardSerializer;
  core?: CoreMathSerializationModule;
  options?: RichClipboardOptions;
}

export interface MathCopyBoundaryProps extends UseMathClipboardOptions {
  children: ReactNode;
  className?: string;
}

export function normalizeClipboardText(text: string): string {
  return normalizeCoreClipboardText(text);
}

export function createCoreMathClipboardSerializer(
  core: CoreMathSerializationModule,
): MathClipboardSerializer {
  return (input) => {
    const serializer = input.range ? core.serializeSelection : core.serializeRenderedMath;
    return serializer?.(input) ?? serializeRenderedMath(input);
  };
}

export function serializeRenderedMath({
  root,
  plainText = '',
  range,
  options,
}: MathClipboardSerializerInput): string {
  const coreOptions: RichClipboardOptions = {
    mathSourceAttribute: 'data-math-source',
    excludeSelector: 'script,style,[data-math-copy-exclude="true"],.katex-mathml',
    ...options,
  };
  return range
    ? richSelectionToMarkdown(range, root, plainText, coreOptions)
    : richDomToMarkdown(root, plainText, coreOptions);
}

export function useMathClipboard({ serializer, core, options }: UseMathClipboardOptions = {}) {
  const activeSerializer =
    serializer ?? (core ? createCoreMathClipboardSerializer(core) : serializeRenderedMath);

  const serializeSelection = useCallback(
    (root: ParentNode, plainText = '', range?: Range) => {
      const input: MathClipboardSerializerInput = { root, plainText };
      if (range) input.range = range;
      if (options) input.options = options;
      return activeSerializer(input);
    },
    [activeSerializer, options],
  );

  const handleCopy = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      const selection = event.currentTarget.ownerDocument.getSelection();
      const range =
        selection && selection.rangeCount === 1 ? selection.getRangeAt(0).cloneRange() : undefined;
      const input: MathClipboardSerializerInput = {
        root: event.currentTarget,
        plainText: selection?.toString() ?? '',
      };
      if (range) input.range = range;
      if (options) input.options = options;
      const text = activeSerializer(input);
      if (!text) return;
      event.preventDefault();
      event.clipboardData.setData('text/plain', text);
    },
    [activeSerializer, options],
  );

  return { handleCopy, serializeSelection };
}

export function MathCopyBoundary({
  children,
  className,
  serializer,
  core,
  options,
}: MathCopyBoundaryProps) {
  const clipboardOptions: UseMathClipboardOptions = {};
  if (serializer) clipboardOptions.serializer = serializer;
  if (core) clipboardOptions.core = core;
  if (options) clipboardOptions.options = options;
  const { handleCopy } = useMathClipboard(clipboardOptions);
  return (
    <div className={className ?? 'mre-copy-boundary'} onCopy={handleCopy}>
      {children}
    </div>
  );
}
