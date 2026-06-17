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

/** Fraction of the viewport height the user must scroll before the band morphs (O5). */
const COMPACT_SCROLL_FRACTION = 0.6;

/** True for the home route (and the degenerate empty path). */
export function isHomeRoute(route: string): boolean {
  return route === '/' || route === '';
}

/**
 * Whether the band should render compact.
 *
 * DEFECT-2 FIX: compactness depends ONLY on device/route/scroll — never on
 * whether a content box is open. Opening a hero box must keep the band in hero
 * state (R1). `activeStationId` is intentionally NOT read here.
 */
export function isCompact(i: BandInput): boolean {
  const threshold = i.viewportH * COMPACT_SCROLL_FRACTION;
  return (
    i.isMobile ||
    i.route.startsWith('/blog') ||
    (isHomeRoute(i.route) && i.scrollY > threshold)
  );
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
    return {
      activeStationId: current.activeStationId,
      effect: { kind: 'navigate', route: station.route ?? '/' },
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
