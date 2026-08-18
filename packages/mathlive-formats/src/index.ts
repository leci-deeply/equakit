import { ComputeEngine } from '@cortex-js/compute-engine';
import type { MathClipboardFormatConverter } from '@equakit/clipboard-formats';
import { convertLatexToAsciiMath, convertLatexToMathMl } from 'mathlive/ssr';

export type { MathClipboardFormatConverter } from '@equakit/clipboard-formats';

export interface MathLiveClipboardConverterOptions {
  canonicalMathJSON?: boolean;
  computeEngine?: ComputeEngine;
  generateMathMLIds?: boolean;
}

export function createMathLiveClipboardConverter(
  options: MathLiveClipboardConverterOptions = {},
): MathClipboardFormatConverter {
  const computeEngine = options.computeEngine ?? new ComputeEngine();

  return {
    toAsciiMath(latex: string) {
      return convertLatexToAsciiMath(latex);
    },
    toMathJSON(latex: string) {
      const expression = options.canonicalMathJSON
        ? computeEngine.parse(latex)
        : computeEngine.parse(latex, { form: 'raw' });
      return expression.json;
    },
    toMathML(latex: string) {
      const markup = convertLatexToMathMl(latex, {
        generateID: options.generateMathMLIds ?? false,
      });
      return /^\s*<math(?:\s|>)/.test(markup)
        ? markup
        : `<math xmlns="http://www.w3.org/1998/Math/MathML">${markup}</math>`;
    },
  };
}

export const mathLiveClipboardConverter = createMathLiveClipboardConverter();
