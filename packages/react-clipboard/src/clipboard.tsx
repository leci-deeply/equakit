import { useCallback } from 'react';
import type { ClipboardEvent, ReactNode } from 'react';

import {
  createMathClipboardPayload,
  type MathClipboardFormatConverter,
} from '@equakit/clipboard-formats';
import {
  normalizeClipboardText as normalizeRestoredClipboardText,
  richDomToMarkdown,
  richSelectionToMarkdown,
  type RichClipboardOptions,
} from '@equakit/clipboard-restore';

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
  converter?: MathClipboardFormatConverter;
}

export interface MathCopyBoundaryProps extends UseMathClipboardOptions {
  children: ReactNode;
  className?: string;
}

export function normalizeClipboardText(text: string): string {
  return normalizeRestoredClipboardText(text);
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
  const restoreOptions: RichClipboardOptions = {
    mathSourceAttribute: 'data-math-source',
    excludeSelector: 'script,style,[data-math-copy-exclude="true"],.katex-mathml',
    ...options,
  };
  return range
    ? richSelectionToMarkdown(range, root, plainText, restoreOptions)
    : richDomToMarkdown(root, plainText, restoreOptions);
}

export function useMathClipboard({
  serializer,
  core,
  options,
  converter,
}: UseMathClipboardOptions = {}) {
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
      const payload = createMathClipboardPayload(text, converter);
      for (const [mimeType, value] of Object.entries(payload)) {
        try {
          event.clipboardData.setData(mimeType, value);
        } catch {
          // 浏览器拒绝某个自定义 MIME 时继续保留其余格式。
        }
      }
    },
    [activeSerializer, converter, options],
  );

  return { handleCopy, serializeSelection };
}

export function MathCopyBoundary({
  children,
  className,
  serializer,
  core,
  options,
  converter,
}: MathCopyBoundaryProps) {
  const clipboardOptions: UseMathClipboardOptions = {};
  if (serializer) clipboardOptions.serializer = serializer;
  if (core) clipboardOptions.core = core;
  if (options) clipboardOptions.options = options;
  if (converter) clipboardOptions.converter = converter;
  const { handleCopy } = useMathClipboard(clipboardOptions);
  return (
    <div className={className ?? 'mre-copy-boundary'} onCopy={handleCopy}>
      {children}
    </div>
  );
}
