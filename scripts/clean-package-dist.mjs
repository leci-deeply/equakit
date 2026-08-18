import { existsSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { cwd as getCwd } from 'node:process';
import { fileURLToPath } from 'node:url';

import { packageCatalog } from './package-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = resolve(root, 'packages');
const packageDirectories = new Set(packageCatalog.map(({ directory }) => directory));

const cwd = getCwd();
const cwdRealpath = realpathSync(cwd);
const packagesRootRealpath = realpathSync(packagesRoot);
const packageRelativePath = relative(packagesRootRealpath, cwdRealpath);

if (
  packageRelativePath === '' ||
  packageRelativePath.startsWith('..') ||
  isAbsolute(packageRelativePath)
) {
  throw new Error(`拒绝清理 dist：当前目录 ${cwd} 不在仓库 packages 目录下。`);
}

if (packageRelativePath.includes('/') || packageRelativePath.includes('\\')) {
  throw new Error(`拒绝清理 dist：当前目录 ${cwd} 不是 packages 下的包根目录。`);
}

if (!packageDirectories.has(packageRelativePath)) {
  throw new Error(`拒绝清理 dist：${packageRelativePath} 不在 package catalog 中。`);
}

const manifestPath = resolve(cwdRealpath, 'package.json');
if (!existsSync(manifestPath)) {
  throw new Error(`拒绝清理 dist：${packageRelativePath} 缺少 package.json。`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.name !== `@equakit/${packageRelativePath}`) {
  throw new Error(
    `拒绝清理 dist：${packageRelativePath} 的包名 ${manifest.name ?? '<missing>'} 与目录不匹配。`,
  );
}

const dist = resolve(cwdRealpath, 'dist');
if (relative(cwdRealpath, dist) !== 'dist') {
  throw new Error('拒绝清理 dist：解析出的 dist 路径不安全。');
}

rmSync(dist, { recursive: true, force: true });
globalThis.console.log(`已清理 packages/${packageRelativePath}/dist。`);
