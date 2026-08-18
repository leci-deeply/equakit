import { readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDirectory = resolve(root, 'examples/basic/dist/assets');
const entries = readdirSync(assetsDirectory).map((name) => ({
  name,
  bytes: statSync(resolve(assetsDirectory, name)).size,
}));
const javascript = entries.filter(({ name }) => name.endsWith('.js'));
const styles = entries.filter(({ name }) => name.endsWith('.css'));

const budgets = {
  javascriptTotal: 3_450_000,
  largestJavascriptChunk: 1_520_000,
  stylesTotal: 50_000,
};

if (javascript.length < 3) {
  throw new Error(
    `Demo 只生成了 ${javascript.length} 个 JavaScript chunk，可选重依赖可能未保持拆分。`,
  );
}
if (!javascript.some(({ name }) => name.startsWith('mathlive.min-'))) {
  throw new Error('Demo 没有生成独立的 MathLive chunk。');
}

const javascriptTotal = sumBytes(javascript);
const stylesTotal = sumBytes(styles);
const largestJavascript = javascript.reduce(
  (largest, entry) => (entry.bytes > largest.bytes ? entry : largest),
  { name: '<none>', bytes: 0 },
);

assertWithinBudget('JavaScript 总量', javascriptTotal, budgets.javascriptTotal);
assertWithinBudget(
  `最大 JavaScript chunk（${largestJavascript.name}）`,
  largestJavascript.bytes,
  budgets.largestJavascriptChunk,
);
assertWithinBudget('CSS 总量', stylesTotal, budgets.stylesTotal);

globalThis.console.log(
  `已验证 Demo 体积预算：JavaScript ${javascriptTotal} B，最大 chunk ${largestJavascript.bytes} B，CSS ${stylesTotal} B。`,
);

function sumBytes(files) {
  return files.reduce((total, { bytes }) => total + bytes, 0);
}

function assertWithinBudget(label, actual, budget) {
  if (actual > budget) {
    throw new Error(`${label} ${actual} B 超过预算 ${budget} B。`);
  }
}
