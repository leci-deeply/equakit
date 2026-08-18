import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { packageCatalog } from './package-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(resolve(tmpdir(), 'equakit-pack-'));
const archiveDirectory = resolve(temp, 'archives');
const repositoryUrl = 'git+https://github.com/leci-deeply/equakit.git';
const bugsUrl = 'https://github.com/leci-deeply/equakit/issues';
const buildCleanPrefix = 'node ../../scripts/clean-package-dist.mjs && ';
const reactPeerRange = '^18.3.1 || ^19.0.0';
const reactDevRange = '^18.3.1';
const archives = [];

assertCatalogMatchesPackageDirectories();

try {
  mkdirSync(archiveDirectory);
  execFileSync(
    'pnpm',
    ['--recursive', '--filter', './packages/*', 'pack', '--pack-destination', archiveDirectory],
    { cwd: root, stdio: 'pipe' },
  );

  for (const { directory } of packageCatalog) {
    const sourceManifest = readPackageManifest(directory);
    const archiveName = `${sourceManifest.name.replace(/^@/, '').replaceAll('/', '-')}-${sourceManifest.version}.tgz`;
    const archiveExists = readdirSync(archiveDirectory).includes(archiveName);
    if (!archiveExists) throw new Error(`${directory} 没有生成 tarball。`);
    const archive = resolve(archiveDirectory, archiveName);
    archives.push(archive);
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
    const unexpected = entries.filter(
      (entry) =>
        !entry.startsWith('package/dist/') &&
        entry !== 'package/README.md' &&
        entry !== 'package/LICENSE' &&
        entry !== 'package/package.json',
    );
    if (unexpected.length > 0) {
      throw new Error(`${directory} tarball 包含非预期文件：${unexpected.join(', ')}`);
    }

    const manifest = JSON.parse(
      execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
    );
    if (manifest.version !== sourceManifest.version) {
      throw new Error(
        `${directory} tarball 版本 ${manifest.version ?? '<missing>'} 与源码 package.json 版本 ${sourceManifest.version} 不一致。`,
      );
    }
    const dependencyValues = [
      ...Object.values(manifest.dependencies ?? {}),
      ...Object.values(manifest.peerDependencies ?? {}),
      ...Object.values(manifest.optionalDependencies ?? {}),
      ...Object.values(manifest.devDependencies ?? {}),
    ];
    if (dependencyValues.some((value) => String(value).startsWith('workspace:'))) {
      throw new Error(`${directory} tarball 仍包含 workspace 协议依赖。`);
    }
    if (!entries.includes('package/LICENSE')) {
      throw new Error(`${directory} tarball 缺少 LICENSE。`);
    }
    if (manifest.name !== sourceManifest.name) {
      throw new Error(`${directory} tarball 的 npm scope 或包名不正确。`);
    }
    assertPackageReadiness(manifest, directory, 'tarball manifest');
    if (manifest.license !== 'MIT') {
      throw new Error(`${directory} tarball 的许可证元数据不是 MIT。`);
    }
    if (
      manifest.author?.name !== 'leci' ||
      manifest.author?.url !== 'https://github.com/leci-deeply'
    ) {
      throw new Error(`${directory} tarball 的作者元数据不完整。`);
    }
    if (
      manifest.repository?.type !== 'git' ||
      manifest.repository?.url !== repositoryUrl ||
      manifest.repository?.directory !== `packages/${directory}`
    ) {
      throw new Error(`${directory} tarball 的 GitHub 仓库元数据不完整。`);
    }
    if (
      manifest.bugs?.url !== bugsUrl ||
      !manifest.homepage?.startsWith('https://github.com/leci-deeply/equakit/')
    ) {
      throw new Error(`${directory} tarball 的主页或问题反馈地址不完整。`);
    }
    if (manifest.publishConfig?.access !== 'public') {
      throw new Error(`${directory} tarball 没有声明公开发布 scoped package。`);
    }
  }

  for (const { directory, expectedExport } of packageCatalog) {
    const module = await import(
      pathToFileURL(resolve(root, `packages/${directory}/dist/index.js`)).href
    );
    if (module[expectedExport] === undefined) {
      throw new Error(`构建后的 ${directory} 入口没有暴露 ${expectedExport}。`);
    }
  }

  const mathLiveClipboardAdapter = await import(
    pathToFileURL(resolve(root, 'packages/adapter-mathlive/dist/clipboard.js')).href
  );
  if (typeof mathLiveClipboardAdapter.createMathLiveClipboardConverter !== 'function') {
    throw new Error('构建后的 MathLive clipboard 入口没有暴露转换器。');
  }

  verifyInstalledTarballs();
} finally {
  rmSync(temp, { recursive: true, force: true });
}

globalThis.console.log(
  `已验证 ${packageCatalog.length} 个包的 tarball、构建后 ESM 入口和真实消费者安装导入。`,
);

function readPackageManifest(directory) {
  const manifest = JSON.parse(
    readFileSync(resolve(root, 'packages', directory, 'package.json'), 'utf8'),
  );
  if (manifest.name !== `@equakit/${directory}`) {
    throw new Error(`${directory} 的 package.json 包名不是 @equakit/${directory}。`);
  }
  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    throw new Error(`${directory} 的 package.json 缺少有效版本。`);
  }
  assertPackageReadiness(manifest, directory, '源码 package.json');
  return manifest;
}

function assertCatalogMatchesPackageDirectories() {
  const catalogDirectories = packageCatalog.map(({ directory }) => directory).sort();
  const uniqueCatalogDirectories = new Set(catalogDirectories);
  if (uniqueCatalogDirectories.size !== catalogDirectories.length) {
    throw new Error('package catalog 存在重复目录。');
  }

  const packagesDirectories = readdirSync(resolve(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const packagesDirectorySet = new Set(packagesDirectories);
  const missingFromCatalog = packagesDirectories.filter(
    (directory) => !uniqueCatalogDirectories.has(directory),
  );
  const missingFromPackages = catalogDirectories.filter(
    (directory) => !packagesDirectorySet.has(directory),
  );

  if (missingFromCatalog.length > 0 || missingFromPackages.length > 0) {
    throw new Error(
      `package catalog 与 packages 目录不一致：catalog 缺少 ${formatList(missingFromCatalog)}；packages 缺少 ${formatList(missingFromPackages)}。`,
    );
  }
}

function assertPackageReadiness(manifest, directory, label) {
  if (manifest.private !== true) {
    throw new Error(`${directory} 的 ${label} 必须保留 private: true。`);
  }
  if (manifest.engines?.node !== '>=22') {
    throw new Error(`${directory} 的 ${label} 必须声明 engines.node >=22。`);
  }
  if (!manifest.scripts?.build?.startsWith(buildCleanPrefix)) {
    throw new Error(`${directory} 的 ${label} build 脚本必须先安全清理 dist。`);
  }
  assertReactRanges(
    manifest.peerDependencies,
    directory,
    label,
    'peerDependencies',
    reactPeerRange,
  );
  assertReactRanges(manifest.devDependencies, directory, label, 'devDependencies', reactDevRange);
}

function assertReactRanges(dependencies, directory, label, field, expectedRange) {
  for (const packageName of ['react', 'react-dom']) {
    const version = dependencies?.[packageName];
    if (version !== undefined && version !== expectedRange) {
      throw new Error(
        `${directory} 的 ${label} ${field}.${packageName} 必须是 ${expectedRange}，当前是 ${version}。`,
      );
    }
  }
}

function formatList(values) {
  return values.length === 0 ? '<none>' : values.join(', ');
}

function verifyInstalledTarballs() {
  const consumer = resolve(temp, 'consumer');
  mkdirSync(consumer);
  const tarballDependencies = Object.fromEntries(
    packageCatalog.map(({ directory }, index) => [
      `@equakit/${directory}`,
      `file:${archives[index]}`,
    ]),
  );
  const externalPeerDependencies = {
    '@cortex-js/compute-engine': '0.58.0',
    '@tiptap/core': '3.30.1',
    '@tiptap/extension-mathematics': '3.30.1',
    '@tiptap/pm': '3.30.1',
    '@types/react': '18.3.31',
    '@types/react-dom': '18.3.7',
    katex: '0.18.4',
    mathlive: '0.110.0',
    react: '18.3.1',
    'react-dom': '18.3.1',
  };
  const overrideLines = Object.entries(tarballDependencies)
    .map(([packageName, archive]) => `  '${packageName}': '${archive}'`)
    .join('\n');

  writeFileSync(
    resolve(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'equakit-tarball-consumer',
        private: true,
        type: 'module',
        dependencies: { ...externalPeerDependencies, ...tarballDependencies },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    resolve(consumer, 'pnpm-workspace.yaml'),
    `packages:\n  - .\n\noverrides:\n${overrideLines}\n`,
  );
  execFileSync(
    'pnpm',
    ['install', '--prefer-offline', '--ignore-scripts', '--config.auto-install-peers=false'],
    {
      cwd: consumer,
      stdio: 'pipe',
    },
  );

  for (const { directory, expectedExport } of packageCatalog) {
    const packageName = `@equakit/${directory}`;
    const clipboardProbe =
      directory === 'adapter-mathlive'
        ? `const clipboard = await import('${packageName}/clipboard'); if (typeof clipboard.createMathLiveClipboardConverter !== 'function') throw new Error('${packageName}/clipboard 安装后不可用');`
        : '';
    const probeSource = `const module = await import('${packageName}'); if (module['${expectedExport}'] === undefined) throw new Error('${packageName} 安装后没有暴露 ${expectedExport}'); ${clipboardProbe}`;
    execFileSync('node', ['--input-type=module', '--eval', probeSource], {
      cwd: consumer,
      stdio: 'pipe',
    });
  }
}
