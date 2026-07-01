// Tests the pure band state core (src/lib/band-state.ts), run via Vitest
// (see vitest.config.ts — getViteConfig() so BASE_PATH resolves against the
// real astro.config.mjs, same as dev/build).
// Traceability: SPEC_hero-fullscreen.md - routing and base-path utilities.

import { describe, expect, test } from 'vitest';
import {
  isHomeRoute,
  isCompactRoute,
  stripBasePath,
  buildUrl,
  BASE_PATH,
} from '../src/lib/band-state.ts';

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

// --- isCompactRoute (SPEC_hero-fullscreen.md §3.1) -----------------------

describe('isCompactRoute', () => {
  test('home route is NOT compact', () => {
    expect(isCompactRoute('/')).toBe(false);
    expect(isCompactRoute('')).toBe(false);
    expect(isCompactRoute(BASE_PATH)).toBe(false);
  });

  test('all other routes ARE compact', () => {
    expect(isCompactRoute('/blog')).toBe(true);
    expect(isCompactRoute('/blog/some-post')).toBe(true);
    expect(isCompactRoute('/impressum')).toBe(true);
    expect(isCompactRoute('/datenschutz')).toBe(true);
    // With base path
    expect(isCompactRoute(`${BASE_PATH}/blog`)).toBe(true);
    expect(isCompactRoute(`${BASE_PATH}/blog/some-post`)).toBe(true);
    expect(isCompactRoute(`${BASE_PATH}/impressum`)).toBe(true);
  });
});
