import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'site-dist');
const required = ['index.html', 'api/index.html', '.nojekyll'];

for (const path of required) {
  if (!existsSync(resolve(output, path))) throw new Error(`站点产物缺少 ${path}。`);
}

const rootHtml = readFileSync(resolve(output, 'index.html'), 'utf8');
if (!rootHtml.includes('/equakit/assets/')) {
  throw new Error('Playground 资产没有使用 GitHub Pages project base。');
}
const apiHtml = readFileSync(resolve(output, 'api/index.html'), 'utf8');
if (!apiHtml.includes('https://leci-deeply.github.io/equakit/')) {
  throw new Error('API 文档缺少返回 Playground 的公开链接。');
}

let hasApiLink = false;

for (const path of collectTextFiles(output)) {
  const text = readFileSync(path, 'utf8');
  if (text.includes('/equakit/api/')) hasApiLink = true;
  if (text.includes('/Users/openclaw') || text.includes('openclawdeMac')) {
    throw new Error(`站点产物包含本机绝对路径：${relative(output, path)}`);
  }
}
if (!hasApiLink) throw new Error('Playground 产物缺少 API 文档链接。');

globalThis.console.log('已验证 Playground、API 文档、相对资源路径和站点脱敏。');

function collectTextFiles(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) files.push(...collectTextFiles(path));
    else if (/\.(?:css|html|js|json|map|txt|xml)$/i.test(name)) files.push(path);
  }
  return files;
}
