import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'site-dist');
const demo = resolve(root, 'examples/basic/dist');

execFileSync('pnpm', ['build'], { cwd: root, stdio: 'inherit' });
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(demo, output, { recursive: true });
writeFileSync(resolve(output, '.nojekyll'), '');
execFileSync('pnpm', ['exec', 'typedoc', '--options', 'typedoc.json'], {
  cwd: root,
  stdio: 'inherit',
});
execFileSync('node', ['scripts/verify-site.mjs'], { cwd: root, stdio: 'inherit' });
