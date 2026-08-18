import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { atomicPackageDirectories, packageCatalog } from './package-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = resolve(root, 'packages');
const aggregatePackages = new Set([
  '@equakit/core',
  '@equakit/react',
  '@equakit/adapter-mathlive',
  '@equakit/adapter-tiptap',
]);
const zeroDependencyPackages = new Set(['answer-steps', 'async-guard', 'choice', 'math-text']);
const manifests = new Map();

for (const { directory } of packageCatalog) {
  const manifestPath = resolve(packageRoot, directory, 'package.json');
  if (!existsSync(manifestPath))
    throw new Error(`缺少技能包清单：packages/${directory}/package.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifests.set(manifest.name, manifest);

  if (manifest.name !== `@equakit/${directory}`) {
    throw new Error(`packages/${directory} 的包名必须是 @equakit/${directory}。`);
  }

  if (!atomicPackageDirectories.includes(directory)) continue;

  const allDependencyNames = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ];
  const aggregateDependency = allDependencyNames.find((name) => aggregatePackages.has(name));
  if (aggregateDependency) {
    throw new Error(`${manifest.name} 不能反向依赖兼容聚合包 ${aggregateDependency}。`);
  }

  if (
    zeroDependencyPackages.has(directory) &&
    Object.keys(manifest.dependencies ?? {}).length > 0
  ) {
    throw new Error(`${manifest.name} 必须保持零生产依赖。`);
  }

  verifyNarrowDependencies(directory, manifest);
  verifySourceImports(directory, manifest);
}

verifyNoRuntimeCycles();
globalThis.console.log('已验证原子技能包的依赖方向、窄依赖规则和运行时无环结构。');

function verifyNarrowDependencies(directory, manifest) {
  const dependencies = Object.keys(manifest.dependencies ?? {});
  const hasDependencyMatching = (pattern) => dependencies.some((name) => pattern.test(name));

  if (
    (directory === 'clipboard-restore' || directory === 'clipboard-formats') &&
    hasDependencyMatching(/^(?:react|react-dom|katex|mathlive|@cortex-js\/compute-engine)$/)
  ) {
    throw new Error(`${manifest.name} 不能引入 React、KaTeX、MathLive 或 Compute Engine。`);
  }
  if (directory === 'mathlive-editor' && hasDependencyMatching(/@cortex-js\/compute-engine/)) {
    throw new Error('@equakit/mathlive-editor 不能引入 Compute Engine。');
  }
  if (directory === 'mathlive-formats' && hasDependencyMatching(/^react(?:-dom)?$/)) {
    throw new Error('@equakit/mathlive-formats 不能引入 React。');
  }
}

function verifySourceImports(directory, manifest) {
  const sourceDirectory = resolve(packageRoot, directory, 'src');
  const declaredDependencies = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  for (const path of collectSourceFiles(sourceDirectory)) {
    const source = readFileSync(path, 'utf8');
    for (const aggregatePackage of aggregatePackages) {
      if (source.includes(`'${aggregatePackage}'`) || source.includes(`"${aggregatePackage}"`)) {
        throw new Error(`packages/${directory} 的源码不能导入聚合包 ${aggregatePackage}。`);
      }
    }
    for (const match of source.matchAll(/['"](@equakit\/[^/'"]+)/g)) {
      const dependency = match[1];
      if (dependency !== manifest.name && !declaredDependencies.has(dependency)) {
        throw new Error(`${manifest.name} 导入了未在生产或 peer 依赖中声明的 ${dependency}。`);
      }
    }
  }
}

function verifyNoRuntimeCycles() {
  const graph = new Map();
  for (const [packageName, manifest] of manifests) {
    graph.set(
      packageName,
      Object.keys(manifest.dependencies ?? {}).filter((dependency) => manifests.has(dependency)),
    );
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (packageName, path) => {
    if (visiting.has(packageName)) {
      throw new Error(`检测到运行时循环依赖：${[...path, packageName].join(' → ')}`);
    }
    if (visited.has(packageName)) return;
    visiting.add(packageName);
    for (const dependency of graph.get(packageName) ?? [])
      visit(dependency, [...path, packageName]);
    visiting.delete(packageName);
    visited.add(packageName);
  };

  for (const packageName of graph.keys()) visit(packageName, []);
}

function collectSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) files.push(...collectSourceFiles(path));
    else if (/\.[cm]?[jt]sx?$/.test(name)) files.push(path);
  }
  return files;
}
