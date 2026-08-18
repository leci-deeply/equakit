export const packageCatalog = Object.freeze([
  { directory: 'answer-steps', expectedExport: 'formatStepAnswer' },
  { directory: 'async-guard', expectedExport: 'StaleResponseGuard' },
  { directory: 'choice', expectedExport: 'gradeChoiceAnswer' },
  { directory: 'math-text', expectedExport: 'normalizeMarkdownMath' },
  { directory: 'katex-engine', expectedExport: 'validateMarkdownMath' },
  { directory: 'clipboard-restore', expectedExport: 'richDomToMarkdown' },
  { directory: 'clipboard-formats', expectedExport: 'createMathClipboardPayload' },
  { directory: 'react-katex', expectedExport: 'MathFormula' },
  { directory: 'react-markdown-math', expectedExport: 'MarkdownMath' },
  { directory: 'react-formula-input', expectedExport: 'FormulaInput' },
  { directory: 'react-clipboard', expectedExport: 'MathCopyBoundary' },
  { directory: 'react-answer-steps', expectedExport: 'AnswerStepsEditor' },
  { directory: 'react-choice', expectedExport: 'InteractiveChoices' },
  { directory: 'mathlive-editor', expectedExport: 'MathLiveFormulaEditor' },
  { directory: 'mathlive-formats', expectedExport: 'createMathLiveClipboardConverter' },
  { directory: 'tiptap-math', expectedExport: 'createTipTapMathExtensions' },
  { directory: 'core', expectedExport: 'normalizeMarkdownMath' },
  { directory: 'react', expectedExport: 'MathFormula' },
  { directory: 'adapter-mathlive', expectedExport: 'MathLiveFormulaEditor' },
  { directory: 'adapter-tiptap', expectedExport: 'createTipTapMathExtensions' },
]);

export const atomicPackageDirectories = Object.freeze(
  packageCatalog.slice(0, 16).map(({ directory }) => directory),
);

export const compatibilityPackageDirectories = Object.freeze(
  packageCatalog.slice(16).map(({ directory }) => directory),
);
