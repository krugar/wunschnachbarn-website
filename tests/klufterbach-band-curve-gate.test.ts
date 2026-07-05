// Regression guard for SPEC/DESIGN_hero-fullscreen-amendment-1.md's RB19 fit
// gate (min-width AND min-height for curve-overlay). The two thresholds
// cannot be a single shared CSS custom property — `var()` resolves
// per-element at computed-value time, `@media` conditions are evaluated
// statically before any element exists to resolve one against (see
// DESIGN_hero-fullscreen-amendment-1.md §2 for the full reasoning). So the
// numbers are authored once as JS constants (CURVE_MIN_W/CURVE_MIN_H in
// KlufterbachBand.astro's <script>) and the CSS keeps a literal that must
// match. This test is what makes "must match" actually enforced instead of
// a comment nobody's obligated to honor — same discipline that closed the
// BASE_PATH duplication incident (SPEC_hero-fullscreen.md §3.7).

import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENT_PATH = join(__dirname, '..', 'src', 'components', 'KlufterbachBand.astro');
const source = readFileSync(COMPONENT_PATH, 'utf-8');

function extractConst(name: string): number {
  const match = source.match(new RegExp(`const ${name}\\s*=\\s*(\\d+)`));
  if (!match) throw new Error(`Could not find JS constant ${name} in ${COMPONENT_PATH}`);
  return Number(match[1]);
}

function extractCurveOverlayMediaQuery(): { minWidth: number; minHeight: number } {
  const match = source.match(
    /@media \(min-width:\s*(\d+)px\) and \(min-height:\s*(\d+)px\)/
  );
  if (!match) {
    throw new Error(
      `Could not find the curve-overlay @media (min-width) and (min-height) condition in ${COMPONENT_PATH}`
    );
  }
  return { minWidth: Number(match[1]), minHeight: Number(match[2]) };
}

function extractBaselineMediaQuery(): { maxWidth: number; maxHeight: number } {
  const match = source.match(
    /@media \(max-width:\s*(\d+)px\),\s*\(max-height:\s*(\d+)px\)/
  );
  if (!match) {
    throw new Error(
      `Could not find the baseline @media (max-width), (max-height) condition in ${COMPONENT_PATH}`
    );
  }
  return { maxWidth: Number(match[1]), maxHeight: Number(match[2]) };
}

describe('curve-overlay fit gate: CSS literals stay in sync with JS constants (RB19)', () => {
  const CURVE_MIN_W = extractConst('CURVE_MIN_W');
  const CURVE_MIN_H = extractConst('CURVE_MIN_H');
  const curveOverlay = extractCurveOverlayMediaQuery();
  const baseline = extractBaselineMediaQuery();

  test('JS constants are sane (positive, width bigger than height threshold is not assumed, just present)', () => {
    expect(CURVE_MIN_W).toBeGreaterThan(0);
    expect(CURVE_MIN_H).toBeGreaterThan(0);
  });

  test('curve-overlay @media min-width matches CURVE_MIN_W', () => {
    expect(curveOverlay.minWidth).toBe(CURVE_MIN_W);
  });

  test('curve-overlay @media min-height matches CURVE_MIN_H', () => {
    expect(curveOverlay.minHeight).toBe(CURVE_MIN_H);
  });

  test('baseline @media is the exact logical complement (De Morgan) of curve-overlay', () => {
    // NOT(min-width:W AND min-height:H) == (max-width:W-1) OR (max-height:H-1)
    expect(baseline.maxWidth).toBe(CURVE_MIN_W - 1);
    expect(baseline.maxHeight).toBe(CURVE_MIN_H - 1);
  });
});
