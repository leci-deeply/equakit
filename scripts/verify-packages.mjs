import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { packageCatalog } from './package-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(resolve(tmpdir(), 'equakit-pack-'));
const archiveDirectory = resolve(temp, 'archives');
const repositoryUrl = 'git+https://github.com/leci-deeply/equakit.git';
const bugsUrl = 'https://github.com/leci-deeply/equakit/issues';
const archives = [];

try {
  mkdirSync(archiveDirectory);
  execFileSync(
    'pnpm',
    ['--recursive', '--filter', './packages/*', 'pack', '--pack-destination', archiveDirectory],
    { cwd: root, stdio: 'pipe' },
  );

  for (const { directory } of packageCatalog) {
    const archiveName = `equakit-${directory}-0.1.0.tgz`;
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
    if (manifest.name !== `@equakit/${directory}`) {
      throw new Error(`${directory} tarball 的 npm scope 或包名不正确。`);
    }
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
