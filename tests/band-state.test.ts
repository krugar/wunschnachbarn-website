// TEMPORARY-DENO test file. Tests the pure band state core (src/lib/band-state.ts).
// Uses Deno std assertions; on a Vitest migration, swap these imports for `expect`.
// Traceability: each test names the SPEC requirement (R1–R6) it covers.

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  isCompact,
  isHomeRoute,
  reduceStationClick,
  reconcileOnCompactChange,
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

// --- isHomeRoute ------------------------------------------------------------

Deno.test('isHomeRoute: / and empty are home, others are not', () => {
  assertEquals(isHomeRoute('/'), true);
  assertEquals(isHomeRoute(''), true);
  assertEquals(isHomeRoute('/blog'), false);
  assertEquals(isHomeRoute('/impressum'), false);
});

// --- isCompact (defect 2 is the headline case) ------------------------------

Deno.test('isCompact: mobile forces compact', () => {
  assertEquals(isCompact(input({ isMobile: true })), true);
});

Deno.test('isCompact: any /blog* route is compact', () => {
  assertEquals(isCompact(input({ route: '/blog' })), true);
  assertEquals(isCompact(input({ route: '/blog/some-post' })), true);
});

Deno.test('isCompact: home + scrolled past 0.6*viewport is compact (R-O5)', () => {
  assertEquals(isCompact(input({ scrollY: 601 })), true);
  assertEquals(isCompact(input({ scrollY: 599 })), false);
});

Deno.test('isCompact: home at top is hero', () => {
  assertEquals(isCompact(input({ scrollY: 0 })), false);
});

Deno.test('DEFECT-2 GUARD: an open box must NOT make the band compact', () => {
  // hero, at top, box open -> still hero. This is the bug we are fixing.
  assertEquals(isCompact(input({ activeStationId: 'projekt' })), false);
});

// --- reduceStationClick -----------------------------------------------------

Deno.test('R5: clicking a route station navigates, leaves active unchanged', () => {
  const r = reduceStationClick(ROUTE, input({ activeStationId: 'wir' }));
  assertEquals(r.effect, { kind: 'navigate', route: '/blog' });
  assertEquals(r.activeStationId, 'wir');
});

Deno.test('R1: hero section click opens that box, no morph effect', () => {
  const r = reduceStationClick(SECTION, input());
  assertEquals(r.activeStationId, 'projekt');
  assertEquals(r.effect, { kind: 'none' });
});

Deno.test('R2: hero click on a different station swaps the open box', () => {
  const r = reduceStationClick(SECTION_2, input({ activeStationId: 'projekt' }));
  assertEquals(r.activeStationId, 'ziele');
  assertEquals(r.effect, { kind: 'none' });
});

Deno.test('R3: hero click on the active station closes the box', () => {
  const r = reduceStationClick(SECTION, input({ activeStationId: 'projekt' }));
  assertEquals(r.activeStationId, null);
  assertEquals(r.effect, { kind: 'none' });
});

Deno.test('R4: compact section click scroll-jumps, opens no box', () => {
  // compact via scroll
  const r = reduceStationClick(SECTION, input({ scrollY: 700 }));
  assertEquals(r.effect, { kind: 'scrollTo', id: 'projekt' });
  assertEquals(r.activeStationId, null);
});

Deno.test('R4: compact via mobile, section click still scroll-jumps', () => {
  const r = reduceStationClick(SECTION, input({ isMobile: true }));
  assertEquals(r.effect, { kind: 'scrollTo', id: 'projekt' });
  assertEquals(r.activeStationId, null);
});

// --- reconcileOnCompactChange (R6) ------------------------------------------

Deno.test('R6: morph hero->compact closes an open box', () => {
  assertEquals(reconcileOnCompactChange(false, true, 'projekt'), null);
});

Deno.test('R6: compact->hero keeps active (no spurious close)', () => {
  assertEquals(reconcileOnCompactChange(true, false, 'projekt'), 'projekt');
});

Deno.test('R6: no compact change keeps active', () => {
  assertEquals(reconcileOnCompactChange(false, false, 'projekt'), 'projekt');
  assertEquals(reconcileOnCompactChange(true, true, null), null);
});
