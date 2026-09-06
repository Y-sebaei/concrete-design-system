/**
 * Verifies that every path in the package's exports map exists after a build.
 *
 * This exists because two of them did not. `./tokens.css` and `./tokens` were
 * declared and never built: Vite emits only what the entry imports, and the
 * entry imports neither. Nothing caught it, because a broken exports map does
 * not fail a build, a test, a typecheck or a lint. It fails at `npm install`
 * in somebody else's project, which is the worst place to find out.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = resolve(root, 'packages/ui');
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'));

const missing = [];

for (const [subpath, value] of Object.entries(pkg.exports)) {
  const targets = typeof value === 'string' ? [value] : Object.values(value);
  for (const target of targets) {
    const file = resolve(pkgDir, target);
    if (existsSync(file)) {
      console.log(`ok    ${subpath} -> ${target}`);
    } else {
      missing.push(`${subpath} -> ${target}`);
      console.error(`MISS  ${subpath} -> ${target}`);
    }
  }
}

if (missing.length > 0) {
  console.error(`\n${missing.length} declared export(s) do not exist after a build.`);
  process.exit(1);
}

console.log(`\nAll ${Object.keys(pkg.exports).length} export subpaths resolve.`);
