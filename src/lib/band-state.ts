// Pure routing/base-path core for the Klufterbach band. NO DOM, NO Svelte, NO Astro imports.
// This is the testable seam: routing helpers and base path utilities.
// Implements SPEC_hero-fullscreen.md RB17/RB18, inherits SPEC_band-and-shell.md routing helpers.
//
// Pattern: rendering components use these pure helpers to determine route
// context and build URLs correctly with the base path.

/** The six band stations. */
export type StationId =
  | 'wir' | 'projekt' | 'ziele' | 'blog' | 'termine' | 'kontakt';

/**
 * Base path, derived from the ONE canonical definition: `astro.config.mjs`'s
 * `base`. Vite injects it as `import.meta.env.BASE_URL` (always with a
 * trailing slash, e.g. '/wunschnachbarn-website/', or '/' at the site root)
 * into every module it processes — including this one, under `vitest` (see
 * vitest.config.ts's `getViteConfig()`, which reads the same astro.config.mjs)
 * as much as under the real Astro build. No literal is hand-maintained here;
 * changing `base` in one place is enough.
 *
 * Normalized to have NO trailing slash ('' at the root, '/wunschnachbarn-website'
 * on GitHub Pages) to match `stripBasePath`/`buildUrl`'s existing convention below.
 */
export const BASE_PATH = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

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
 * True for routes that should render the band in compact mode (slim bar).
 * Currently this is all non-home routes (/blog*, /impressum, /datenschutz, etc.).
 * On the home route, desktop/tablet is always hero-as-page (no scroll morph),
 * so `isCompactRoute` is false there regardless of device.
 */
export function isCompactRoute(route: string): boolean {
  return !isHomeRoute(route);
}

/** Build a full URL with base path for navigation. */
export function buildUrl(path: string): string {
  // Remove leading slash and ensure consistent formatting
  const cleanPath = path.replace(/^\//, '');
  return `${BASE_PATH}/${cleanPath}`;
}
