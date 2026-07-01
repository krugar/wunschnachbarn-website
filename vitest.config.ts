/// <reference types="vitest/config" />
// Replaces the TEMPORARY-DENO harness (see git history: deno.json, tests/band-state.test.ts
// pre-migration). getViteConfig() pulls in the real astro.config.mjs — including `base` —
// so `import.meta.env.BASE_URL` resolves identically in tests, dev, and build. That's the
// whole point: one canonical Base URL definition (astro.config.mjs), not a second one here.
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
