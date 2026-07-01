// Regression guard for the CSS url() base-path defect found while implementing
// SPEC_hero-fullscreen.md / DESIGN_hero-fullscreen.md §3.7, §7 (RB17): a
// hand-written absolute path inside a CSS url() ignores astro.config.mjs's
// `base` and 404s on any deployment where base !== '/' (GitHub Pages:
// '/wunschnachbarn-website'). Found in THREE places across two rounds of
// scanning: KlufterbachBand.astro (forest.webp, forest-texture.png, fixed via
// CSS custom properties set from bandTexture.src / buildUrl()), and — an
// initial .astro-only scan missed these — colors_and_type.css and
// BlogList.svelte (both fixed via a relative url() path instead, which
// Vite's CSS asset pipeline resolves independent of `base`; neither file has
// an Astro frontmatter to run buildUrl() in). This test statically scans
// every .astro, .svelte, and .css file for the same anti-pattern so it
// cannot silently come back in any of these three file kinds.
//
// Allowed url() forms: var(--x) (resolved in frontmatter/JS), data: URIs,
// http(s):// (external), ./relative or ../relative (Vite's CSS asset
// pipeline resolves these against the file, independent of `base`).
// Forbidden: url("/literal/absolute/path") — the exact bug class.

import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = join(__dirname, '..');
const SRC_DIR = join(REPO_ROOT, 'src');

const SCANNED_EXTENSIONS = ['.astro', '.svelte', '.css'];

/** Recursively collect all .astro/.svelte/.css files under a directory. */
function collectScannedFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectScannedFiles(fullPath);
    return SCANNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [fullPath] : [];
  });
}

/**
 * Scan raw source text for `url(...)` calls whose argument is a literal
 * absolute path (leading '/'). Returns the offending `url(...)` snippets.
 */
function findLiteralAbsoluteCssUrls(source: string): string[] {
  // Alternation order matters: try var(...) first (its own, non-nested
  // parens), then quoted strings, then a bare/interpolated fallback.
  const urlPattern = /url\(\s*(var\([^)]*\)|"[^"]*"|'[^']*'|[^)]+)\s*\)/g;
  const offenders: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(source)) !== null) {
    let value = match[1].trim();
    if (value.startsWith('var(')) continue; // CSS variable, resolved elsewhere
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('data:')) continue;
    if (value.startsWith('http://') || value.startsWith('https://')) continue;
    if (value.startsWith('./') || value.startsWith('../')) continue;
    if (value.startsWith('#')) continue; // SVG fragment ref (url(#klu-grad)), not an asset path
    if (value.startsWith('/')) offenders.push(match[0]);
  }
  return offenders;
}

describe('CSS url() base-path regression guard', () => {
  const scannedFiles = collectScannedFiles(SRC_DIR);

  test('found at least one file of each scanned kind (sanity check)', () => {
    for (const ext of SCANNED_EXTENSIONS) {
      expect(scannedFiles.some((f) => f.endsWith(ext))).toBe(true);
    }
  });

  for (const filePath of scannedFiles) {
    const relPath = relative(REPO_ROOT, filePath);
    test(`${relPath}: no hardcoded absolute-path CSS url()`, () => {
      const source = readFileSync(filePath, 'utf-8');
      const offenders = findLiteralAbsoluteCssUrls(source);
      expect(offenders).toEqual([]);
    });
  }
});
