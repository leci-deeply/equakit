import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stylePackages = [
  'react-katex',
  'react-markdown-math',
  'react-formula-input',
  'react-clipboard',
  'react-answer-steps',
  'react-choice',
];
const outputDirectory = resolve(root, 'packages/react/dist');
const output = stylePackages
  .map((packageName) =>
    readFileSync(resolve(root, `packages/${packageName}/src/styles.css`), 'utf8'),
  )
  .join('\n');

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, 'styles.css'), output);
