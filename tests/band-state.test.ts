// Tests the pure band state core (src/lib/band-state.ts), run via Vitest
// (see vitest.config.ts — getViteConfig() so BASE_PATH resolves against the
// real astro.config.mjs, same as dev/build).
// Traceability: each test names the SPEC requirement (R1–R6) it covers.

import { describe, expect, test } from 'vitest';
import {
  bandProgress,
  isCompact,
  isHomeRoute,
  reduceStationClick,
  reconcileOnCompactChange,
  stripBasePath,
  buildUrl,
  BASE_PATH,
  type BandInput,
  type StationDef,
} from '../src/lib/band-state.ts';

// --- Fixtures ---------------------------------------------------------------

const SECTION: StationDef = { id: 'projekt', label: 'Projekt', t: 0.26, kind: 'section' };
const SECTION_2: StationDef = { id: 'ziele', label: 'Ziele', t: 0.4, kind: 'section' };
const ROUTE: StationDef = { id: 'blog', label: 'Blog', t: 0.55, kind: 'route', route: '/blog' };

/** Build a BandInput with sensible hero-on-home defaults; override per test. */
function input(over: Partial<BandInput> = {}): BandInput {
  return {
    isMobile: false,
    route: '/',
    scrollY: 0,
    viewportH: 1000, // threshold = 600
    activeStationId: null,
    ...over,
  };
}

// --- stripBasePath --------------------------------------------------------

describe('stripBasePath', () => {
  test('removes base path from full URL', () => {
    expect(stripBasePath(BASE_PATH)).toBe('/');
    expect(stripBasePath(`${BASE_PATH}/`)).toBe('/');
    expect(stripBasePath(`${BASE_PATH}/blog`)).toBe('/blog');
    expect(stripBasePath(`${BASE_PATH}/blog/post-1`)).toBe('/blog/post-1');
    expect(stripBasePath('/')).toBe('/');
    expect(stripBasePath('/blog')).toBe('/blog');
  });
});

// --- buildUrl -------------------------------------------------------------

describe('buildUrl', () => {
  test('adds base path to relative URL', () => {
    expect(buildUrl('/')).toBe(`${BASE_PATH}/`);
    expect(buildUrl('/blog')).toBe(`${BASE_PATH}/blog`);
    expect(buildUrl('/blog/post-1')).toBe(`${BASE_PATH}/blog/post-1`);
  });
});

// --- isHomeRoute ------------------------------------------------------------

describe('isHomeRoute', () => {
  test('/ and empty are home, others are not', () => {
    expect(isHomeRoute('/')).toBe(true);
    expect(isHomeRoute('')).toBe(true);
    expect(isHomeRoute('/blog')).toBe(false);
    expect(isHomeRoute('/impressum')).toBe(false);
    // With base path
    expect(isHomeRoute(BASE_PATH)).toBe(true);
    expect(isHomeRoute(`${BASE_PATH}/`)).toBe(true);
    expect(isHomeRoute(`${BASE_PATH}/blog`)).toBe(false);
    expect(isHomeRoute(`${BASE_PATH}/impressum`)).toBe(false);
  });
});

// --- isCompact (defect 2 is the headline case) ------------------------------

describe('isCompact', () => {
  test('mobile forces compact', () => {
    expect(isCompact(input({ isMobile: true }))).toBe(true);
  });

  test('any /blog* route is compact', () => {
    expect(isCompact(input({ route: '/blog' }))).toBe(true);
    expect(isCompact(input({ route: '/blog/some-post' }))).toBe(true);
    // With base path
    expect(isCompact(input({ route: `${BASE_PATH}/blog` }))).toBe(true);
    expect(isCompact(input({ route: `${BASE_PATH}/blog/some-post` }))).toBe(true);
  });

  test('home + scrolled past 1.0*viewport is compact (R-O5)', () => {
    expect(isCompact(input({ scrollY: 1001 }))).toBe(true);
    expect(isCompact(input({ scrollY: 999 }))).toBe(false);
  });

  test('home at top is hero', () => {
    expect(isCompact(input({ scrollY: 0 }))).toBe(false);
  });

  test('DEFECT-2 GUARD: an open box must NOT make the band compact', () => {
    // hero, at top, box open -> still hero. This is the bug we are fixing.
    expect(isCompact(input({ activeStationId: 'projekt' }))).toBe(false);
  });

  test('tracks the END of the dive (progress >= 1)', () => {
    expect(isCompact(input({ scrollY: 500 }))).toBe(false); // mid-dive: still hero behaviour
    expect(isCompact(input({ scrollY: 1000 }))).toBe(true); // fully shrunk: reading mode
  });
});

// --- bandProgress (continuous dive, 0..1) -----------------------------------

describe('bandProgress', () => {
  test('home at top is 0 (full hero)', () => {
    expect(bandProgress(input({ scrollY: 0 }))).toBe(0);
  });

  test('home halfway through the dive distance is 0.5', () => {
    // distance = 1000 * 1.0 = 1000; scrollY 500 -> 0.5
    expect(bandProgress(input({ scrollY: 500 }))).toBe(0.5);
  });

  test('home past the dive distance clamps to 1', () => {
    expect(bandProgress(input({ scrollY: 1000 }))).toBe(1);
    expect(bandProgress(input({ scrollY: 5000 }))).toBe(1);
  });

  test('mobile, blog, and standalone routes are fully compact (1)', () => {
    expect(bandProgress(input({ isMobile: true, scrollY: 0 }))).toBe(1);
    expect(bandProgress(input({ route: '/blog', scrollY: 0 }))).toBe(1);
    expect(bandProgress(input({ route: '/impressum', scrollY: 0 }))).toBe(1);
    // With base path
    expect(bandProgress(input({ route: `${BASE_PATH}/blog`, scrollY: 0 }))).toBe(1);
    expect(bandProgress(input({ route: `${BASE_PATH}/impressum`, scrollY: 0 }))).toBe(1);
  });

  test('zero viewport height degrades to 1 (no divide-by-zero)', () => {
    expect(bandProgress(input({ viewportH: 0, scrollY: 0 }))).toBe(1);
  });
});

// --- reduceStationClick -----------------------------------------------------

describe('reduceStationClick', () => {
  test('R5: clicking a route station navigates, leaves active unchanged', () => {
    const r = reduceStationClick(ROUTE, input({ activeStationId: 'wir' }));
    expect(r.effect).toEqual({ kind: 'navigate', route: `${BASE_PATH}/blog` });
    expect(r.activeStationId).toBe('wir');
  });

  test('R1: hero section click opens that box, no morph effect', () => {
    const r = reduceStationClick(SECTION, input());
    expect(r.activeStationId).toBe('projekt');
    expect(r.effect).toEqual({ kind: 'none' });
  });

  test('R2: hero click on a different station swaps the open box', () => {
    const r = reduceStationClick(SECTION_2, input({ activeStationId: 'projekt' }));
    expect(r.activeStationId).toBe('ziele');
    expect(r.effect).toEqual({ kind: 'none' });
  });

  test('R3: hero click on the active station closes the box', () => {
    const r = reduceStationClick(SECTION, input({ activeStationId: 'projekt' }));
    expect(r.activeStationId).toBe(null);
    expect(r.effect).toEqual({ kind: 'none' });
  });

  test('R4: compact section click scroll-jumps, opens no box', () => {
    // compact via scroll (past full viewport distance)
    const r = reduceStationClick(SECTION, input({ scrollY: 1001 }));
    expect(r.effect).toEqual({ kind: 'scrollTo', id: 'projekt' });
    expect(r.activeStationId).toBe(null);
  });

  test('R4: compact via mobile, section click still scroll-jumps', () => {
    const r = reduceStationClick(SECTION, input({ isMobile: true }));
    expect(r.effect).toEqual({ kind: 'scrollTo', id: 'projekt' });
    expect(r.activeStationId).toBe(null);
  });
});

// --- reconcileOnCompactChange (R6) ------------------------------------------

describe('reconcileOnCompactChange', () => {
  test('R6: morph hero->compact closes an open box', () => {
    expect(reconcileOnCompactChange(false, true, 'projekt')).toBe(null);
  });

  test('R6: compact->hero keeps active (no spurious close)', () => {
    expect(reconcileOnCompactChange(true, false, 'projekt')).toBe('projekt');
  });

  test('R6: no compact change keeps active', () => {
    expect(reconcileOnCompactChange(false, false, 'projekt')).toBe('projekt');
    expect(reconcileOnCompactChange(true, true, null)).toBe(null);
  });
});
