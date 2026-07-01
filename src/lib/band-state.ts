// Pure state core for the Klufterbach band. NO DOM, NO Svelte, NO Astro imports.
// This is the testable seam: the runtime defect `astro check` could not see
// (compactness wrongly coupled to box-open state) lives here as plain logic.
// Implements SPEC_band-and-shell.md R1–R6, O5.
//
// Pattern: the Svelte component is a thin adapter — it gathers DOM-derived inputs,
// calls these pure functions, and applies the returned effects. Keep it that way.

/** The six band stations. */
export type StationId =
  | 'wir' | 'projekt' | 'ziele' | 'blog' | 'termine' | 'kontakt';

/** Base path for GitHub Pages deployment. */
export const BASE_PATH = '/wunschnachbarn-website';

/** Static definition of a station (D3: `kind` discriminant replaces isRoute/route). */
export interface StationDef {
  id: StationId;
  label: string;
  /** Position along the SVG path, 0..1, consumed by getPointAtLength. */
  t: number;
  kind: 'section' | 'route';
  /** Target path, present iff kind === 'route'. */
  route?: string;
}

/** All DOM-derived inputs the state core needs. The component supplies these. */
export interface BandInput {
  isMobile: boolean;
  /** window.location.pathname */
  route: string;
  scrollY: number;
  /** Viewport height, for the viewport-relative scroll threshold (O5). */
  viewportH: number;
  activeStationId: StationId | null;
}

/** Fraction of the viewport height over which the band shrinks hero→compact (O5). */
const COMPACT_SCROLL_FRACTION = 1.0;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Strip the base path from a route URL. */
export function stripBasePath(route: string): string {
  if (!route.startsWith(BASE_PATH)) return route;
  const withoutBase = route.slice(BASE_PATH.length);
  return withoutBase || '/';
}

/** True for the home route (and the degenerate empty path). */
export function isHomeRoute(route: string): boolean {
  const normalizedRoute = stripBasePath(route);
  return normalizedRoute === '/' || normalizedRoute === '';
}

/**
 * Continuous morph progress, 0 (full hero) → 1 (full compact bar). Drives the
 * "dive into the stream" shrink: the band shrinks as the visitor scrolls.
 *
 * Only the home route scrubs with scroll; everywhere else the band is fully
 * compact (1): mobile, any /blog* route, and standalone routes (impressum etc.).
 */
export function bandProgress(i: BandInput, fraction = COMPACT_SCROLL_FRACTION): number {
  if (i.isMobile) return 1;
  if (!isHomeRoute(i.route)) return 1;
  const distance = i.viewportH * fraction;
  return distance > 0 ? clamp01(i.scrollY / distance) : 1;
}

/**
 * Whether the band is in compact "reading" mode (behavioural switch: station
 * clicks scroll to prose instead of opening boxes; an open box closes).
 *
 * Compact == fully shrunk (progress 1). Keeping the behavioural threshold at the
 * end of the dive means the hero click-reveal still works near the top while the
 * band is mid-shrink.
 *
 * DEFECT-2 FIX: depends ONLY on device/route/scroll — never on whether a box is
 * open. `activeStationId` is intentionally NOT read here.
 */
export function isCompact(i: BandInput): boolean {
  return bandProgress(i) >= 1;
}

/** Build a full URL with base path for navigation. */
export function buildUrl(path: string): string {
  // Remove leading slash and ensure consistent formatting
  const cleanPath = path.replace(/^\//, '');
  return `${BASE_PATH}/${cleanPath}`;
}

/** Side effect a station click asks the component to perform. */
export type ClickEffect =
  | { kind: 'none' }
  | { kind: 'navigate'; route: string }
  | { kind: 'scrollTo'; id: StationId };

/** Result of reducing a station click: the next box state + an effect to run. */
export interface ClickResult {
  activeStationId: StationId | null;
  effect: ClickEffect;
}

/**
 * Reduce a station click into the next box state and an effect.
 *
 * - Route station (Blog): navigate, never open a box, leave active untouched (R5).
 * - Compact + section: scroll to the prose section, open no box (R4).
 * - Hero + section: toggle/swap the box, emit no effect, NO morph (R1, R2, R3).
 */
export function reduceStationClick(
  station: StationDef,
  current: BandInput,
): ClickResult {
  if (station.kind === 'route') {
    const targetRoute = station.route ?? '/';
    return {
      activeStationId: current.activeStationId,
      effect: { kind: 'navigate', route: buildUrl(targetRoute) },
    };
  }

  if (isCompact(current)) {
    return {
      activeStationId: null,
      effect: { kind: 'scrollTo', id: station.id },
    };
  }

  // Hero section station: toggle if same, swap if different (R1/R2/R3).
  const next = current.activeStationId === station.id ? null : station.id;
  return { activeStationId: next, effect: { kind: 'none' } };
}

/**
 * Reconcile the open box when compactness changes (R6).
 * A content box only exists in hero state, so a hero→compact transition closes it.
 * Any other transition (compact→hero, or no change) preserves the current value.
 */
export function reconcileOnCompactChange(
  wasCompact: boolean,
  nowCompact: boolean,
  active: StationId | null,
): StationId | null {
  return !wasCompact && nowCompact ? null : active;
}
