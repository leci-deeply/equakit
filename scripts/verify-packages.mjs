import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['core', 'react'];
const temp = mkdtempSync(resolve(tmpdir(), 'math-rich-editor-pack-'));

try {
  for (const packageName of packages) {
    const packageDir = resolve(root, 'packages', packageName);
    const destination = resolve(temp, packageName);
    mkdirSync(destination);
    execFileSync('pnpm', ['pack', '--pack-destination', destination], {
      cwd: packageDir,
      stdio: 'pipe',
    });

    const archiveName = readdirSync(destination).find((entry) => entry.endsWith('.tgz'));
    if (!archiveName) throw new Error(`No tarball produced for ${packageName}.`);
    const archive = resolve(destination, archiveName);
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
    const unexpected = entries.filter(
      (entry) =>
        !entry.startsWith('package/dist/') &&
        entry !== 'package/README.md' &&
        entry !== 'package/package.json',
    );
    if (unexpected.length > 0) {
      throw new Error(`${packageName} tarball contains unexpected files: ${unexpected.join(', ')}`);
    }

    const manifest = JSON.parse(
      execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
    );
    const dependencyValues = Object.values(manifest.dependencies ?? {});
    if (dependencyValues.some((value) => String(value).startsWith('workspace:'))) {
      throw new Error(`${packageName} tarball still contains workspace protocol dependencies.`);
    }
  }

  const core = await import(pathToFileURL(resolve(root, 'packages/core/dist/index.js')).href);
  const react = await import(pathToFileURL(resolve(root, 'packages/react/dist/index.js')).href);
  if (typeof core.normalizeMarkdownMath !== 'function') {
    throw new Error('Built core entry does not expose normalizeMarkdownMath.');
  }
  if (typeof react.MathFormula !== 'function') {
    throw new Error('Built React entry does not expose MathFormula.');
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

globalThis.console.log('Package tarballs and built ESM entries verified.');
