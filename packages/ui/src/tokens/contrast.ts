/**
 * Checks the contrast contract declared in semantics.ts against both themes.
 *
 * Run by `npm run contrast`, and by CI before anything else. It is the cheapest
 * accessibility test in the repo: it needs no browser, no DOM and no rendering,
 * and it catches the class of failure that is hardest to spot by eye, which is a
 * dark theme that is one ramp step short of legible.
 */
import { light, dark, contrastRules, type SemanticRole } from './semantics';
import { resolve } from './palette';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface CheckResult {
  theme: 'light' | 'dark';
  fg: SemanticRole;
  bg: SemanticRole;
  fgHex: string;
  bgHex: string;
  ratio: number;
  min: number;
  where: string;
  pass: boolean;
}

export function check(): CheckResult[] {
  const results: CheckResult[] = [];
  for (const [name, theme] of [
    ['light', light],
    ['dark', dark],
  ] as const) {
    for (const rule of contrastRules) {
      const fgHex = resolve(theme[rule.fg]);
      const bgHex = resolve(theme[rule.bg]);
      const ratio = contrastRatio(fgHex, bgHex);
      results.push({
        theme: name,
        fg: rule.fg,
        bg: rule.bg,
        fgHex,
        bgHex,
        ratio,
        min: rule.min,
        where: rule.where,
        pass: ratio >= rule.min,
      });
    }
  }
  return results;
}

/* Executed directly by `npm run contrast`. Importing this module for its pure
   helpers, which the Vitest suite does, must not exit the process. */
const invokedDirectly =
  typeof process !== 'undefined' && process.argv[1]?.replace(/\\/g, '/').endsWith('contrast.ts');

if (invokedDirectly) {
  const results = check();
  const failures = results.filter((r) => !r.pass);

  for (const r of results) {
    const mark = r.pass ? 'ok  ' : 'FAIL';
    const ratio = r.ratio.toFixed(2).padStart(5);
    console.log(
      `${mark} ${r.theme.padEnd(5)} ${ratio}:1 (min ${r.min})  ${r.fg} on ${r.bg}  ${r.where}`,
    );
  }

  console.log(`\n${results.length - failures.length}/${results.length} pairs pass.`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} contrast failures:`);
    for (const f of failures) {
      console.error(
        `  ${f.theme}: ${f.fg} (${f.fgHex}) on ${f.bg} (${f.bgHex}) = ${f.ratio.toFixed(2)}:1, needs ${f.min}:1`,
      );
      console.error(`      used for: ${f.where}`);
    }
    process.exit(1);
  }
}
