/**
 * Copies the two hand-written stylesheets into dist.
 *
 * Vite emits only the CSS that the JavaScript entry imports, which is the whole
 * compiled sheet. package.json also exports the token layer and the font import
 * on their own, for consumers who use Tailwind themselves or who self-host the
 * faces, and neither of those is reachable from the entry.
 *
 * CI verifies that every path in the exports map exists after a build, which is
 * what turns a missing file here into a red run rather than a broken install.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const name of ['tokens.css', 'fonts.css']) {
  const to = resolve(root, 'dist', name);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(resolve(root, 'src/styles', name), to);
  console.log(`copied ${name} -> dist/${name}`);
}
