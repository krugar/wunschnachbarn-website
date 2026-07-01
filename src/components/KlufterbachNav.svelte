<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import SectionBox from './SectionBox.svelte';
  import {
    bandProgress,
    isCompact as computeCompact,
    isHomeRoute,
    reduceStationClick,
    reconcileOnCompactChange,
    stripBasePath,
    buildUrl,
    BASE_PATH,
    type BandInput,
    type ClickEffect,
    type StationDef,
    type StationId,
  } from '../lib/band-state';

  /** Linear interpolation, for scrubbing station positions during the dive. */
  const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

  // View-model types shared with SectionBox. Content (bodyHtml) is pre-rendered
  // server-side by the shell and passed as a string — the client never parses
  // markdown (SPEC R15). Single source of truth with the prose (SPEC R7).
  export interface Item {
    bodyHtml: string;
    image?: string;
    imageAlt?: string;
    heading?: string;
  }
  export interface SectionData {
    id: StationId;
    label: string;
    title: string;
    items: Item[];
  }

  interface Props {
    sections: SectionData[]; // O2 — typed, supplied by the shell, used only on '/'
    textureUrl: string; // O3 — resolved at build time by the shell
    initialRoute: string; // current path at SSR, so first paint matches the route
  }
  let { sections, textureUrl, initialRoute }: Props = $props();

  // Structural station definitions. Order + path position only; labels prefer the
  // CMS value (sections prop) and fall back to these defaults. (D3: `kind`.)
  const STATIONS: StationDef[] = [
    { id: 'wir', label: 'Wir', t: 0.14, kind: 'section' },
    { id: 'projekt', label: 'Projekt', t: 0.26, kind: 'section' },
    { id: 'ziele', label: 'Ziele', t: 0.4, kind: 'section' },
    { id: 'blog', label: 'Blog', t: 0.55, kind: 'route', route: '/blog' },
    { id: 'termine', label: 'Termine', t: 0.72, kind: 'section' },
    { id: 'kontakt', label: 'Kontakt', t: 0.89, kind: 'section' },
  ];

  // CORRECTED river path: top-left → bottom-right descent (HANDOFF §3.1).
  const RIVER_D = 'M -53,234 C 219,709 863,-81 1327,629';

  // --- Reactive state -------------------------------------------------------
  let activeStationId = $state<StationId | null>(null);
  let stations = $state(STATIONS.map((s) => ({ ...s, x: 0, y: 0 })));
  let isMobile = $state(false);
  let scrollY = $state(0);
  // Nonzero default so the pre-hydration render computes progress 0 (full hero)
  // on home instead of dividing by zero → compact flash. Replaced on mount.
  let viewportH = $state(800);
  let route = $state(initialRoute);
  let activeScrollSection = $state<string | null>(null);

  // Refs
  let pathEl: SVGPathElement | null = null;

  // --- Derived (delegates all decisions to the pure core) -------------------
  const bandInput = $derived<BandInput>({
    isMobile,
    route,
    scrollY,
    viewportH,
    activeStationId,
  });
  const compact = $derived(computeCompact(bandInput));
  // Continuous 0..1 morph progress (the "dive"): drives all band visuals so the
  // shrink tracks scroll instead of snapping at a threshold (Option B).
  const progress = $derived(bandProgress(bandInput));
  const activeSection = $derived(
    activeStationId ? sections.find((s) => s.id === activeStationId) ?? null : null,
  );

  // R6: when the band morphs hero→compact, close any open box. `prevCompact` is a
  // plain (non-reactive) var tracking the previous value across runs. Assigning
  // activeStationId its current value is a no-op in Svelte 5 (===), so re-running
  // this effect when the box opens/closes cannot loop.
  let prevCompact = false;
  $effect(() => {
    const c = compact;
    activeStationId = reconcileOnCompactChange(prevCompact, c, activeStationId);
    prevCompact = c;
  });

  // --- Effects runner (the only place DOM side effects happen) --------------
  function applyEffect(effect: ClickEffect) {
    switch (effect.kind) {
      case 'navigate':
        navigate(effect.route);
        break;
      case 'scrollTo': {
        const el = document.getElementById(effect.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.replaceState(null, '', `#${effect.id}`);
        }
        break;
      }
      case 'none':
        break;
    }
  }

  function handleStationClick(stationId: StationId) {
    const station = STATIONS.find((s) => s.id === stationId);
    if (!station) return;
    const result = reduceStationClick(station, bandInput);
    activeStationId = result.activeStationId;
    applyEffect(result.effect);
  }

  function closeActiveStation() {
    activeStationId = null;
  }

  function navigateToHome() {
    navigate(buildUrl('/'));
  }

  // Label for a station: CMS label if the section exists, else the structural default.
  function labelFor(station: StationDef): string {
    return sections.find((s) => s.id === station.id)?.label ?? station.label;
  }

  // --- DOM-derived input updates --------------------------------------------
  function computeStationPositions() {
    if (!pathEl) return;
    const totalLength = pathEl.getTotalLength();
    stations = STATIONS.map((s) => {
      const point = pathEl!.getPointAtLength(s.t * totalLength);
      return { ...s, x: point.x, y: point.y };
    });
  }

  function checkMobile() {
    isMobile = window.matchMedia('(max-width: 820px)').matches;
  }

  // Scrollspy: highlight the prose section nearest the top of the viewport.
  // Only meaningful on home, in compact (reading) mode. (SPEC R9.)
  function updateScrollspy() {
    const normalizedRoute = stripBasePath(route);
    if (!isHomeRoute(normalizedRoute) || !compact) return;
    const proseSections = document.querySelectorAll('.section-prose');
    let current: string | null = null;
    let minDistance = Infinity;
    proseSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top);
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= 0 && distance < minDistance) {
        minDistance = distance;
        current = section.id;
      }
    });
    if (current) activeScrollSection = current;
  }

  onMount(() => {
    // Sync all window-derived inputs. Runs on mount AND on every client-side
    // navigation, so listeners work regardless of which route the session
    // started on (SPEC R9 — fixes the persisted-island lifecycle bug).
    const sync = () => {
      route = window.location.pathname;
      viewportH = window.innerHeight;
      scrollY = window.scrollY;
      checkMobile();
      activeScrollSection = null;
      requestAnimationFrame(computeStationPositions);
    };
    sync();

    const onScroll = () => {
      scrollY = window.scrollY;
      updateScrollspy();
    };
    const onResize = () => {
      viewportH = window.innerHeight;
      checkMobile();
      requestAnimationFrame(computeStationPositions);
    };
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && STATIONS.some((s) => s.id === hash && s.kind === 'section')) {
        activeStationId = hash as StationId;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeStationId) closeActiveStation();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Astro fires view-transition lifecycle events on `document` (non-bubbling),
    // NOT window. Listening on window here silently breaks route updates after a
    // client-side navigate() — which left the band stuck compact on /blog → /.
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('keydown', onKeyDown);
    onHashChange(); // honour an initial deep link

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<div
  class="klu-page"
  style:--klu-progress={progress}
  style:--klu-texture-url={`url(${textureUrl})`}
>
  <a href="#main" class="klu-skip">Zum Inhalt springen</a>

  {#if stripBasePath(route).startsWith('/blog')}
    <header class="klu-blog-nav">
      <button class="back-home" onclick={navigateToHome} aria-label="Zurück zur Startseite">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Zurück zum Bach</span>
      </button>
    </header>
  {/if}

  <!-- River SVG with stations overlay -->
  <section class="klu-river">
    <svg
      class="klu-band"
      viewBox="0 0 1280 720"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="klu-soft">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
        <linearGradient id="klu-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#C97AA8" />
          <stop offset="0.4" stop-color="#AE1A6E" />
          <stop offset="1" stop-color="#931558" />
        </linearGradient>
      </defs>
      <path
        class="river-shadow"
        d={RIVER_D}
        style:stroke-width={mix(96, isMobile ? 22 : 38, progress)}
        style:opacity={1 - progress}
      />
      <path
        class="river"
        bind:this={pathEl}
        d={RIVER_D}
        stroke="url(#klu-grad)"
        style:stroke-width={mix(96, isMobile ? 22 : 38, progress)}
      />
    </svg>

    <div class="klu-headline" aria-hidden={compact ? 'true' : undefined}>
      <span class="eyebrow">Wohngenossenschaft · Bonn</span>
      <h1>Gemeinschaft am Klufterbach.</h1>
    </div>

    <div class="klu-subline" aria-hidden={compact ? 'true' : undefined}>
      <p>
        Folge dem Bach. Sechs Stationen erzählen, wer wir sind und wie
        wir am Klufterbach leben wollen.
      </p>
    </div>

    <div class="klu-stations" role="navigation" aria-label="Hauptnavigation">
      {#each stations as station, i (station.id)}
        <button
          type="button"
          class="klu-station"
          class:active={activeScrollSection === station.id && station.kind === 'section'}
          style:left={`${mix((station.x / 1280) * 100, (i / (STATIONS.length - 1)) * 84 + 8, progress)}%`}
          style:top={`${mix((station.y / 720) * 100, 50, progress)}%`}
          aria-expanded={station.kind === 'section' ? activeStationId === station.id : undefined}
          aria-controls={station.kind === 'section' ? `panel-${station.id}` : undefined}
          onclick={() => handleStationClick(station.id)}
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">{labelFor(station)}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Hero content box region (NOT a <main>; the page owns the document's main). -->
  <div class="klu-content" role="region" aria-live="polite">
    {#if activeSection}
      <SectionBox
        id={activeSection.id}
        label={activeSection.label}
        title={activeSection.title}
        items={activeSection.items}
        onClose={closeActiveStation}
      />
    {/if}
  </div>
</div>

<style>
  .klu-page {
    background: var(--wn-paper);
    display: flex;
    flex-direction: column;
  }

  .klu-skip {
    position: absolute;
    top: -100%;
    left: var(--sp-5);
    padding: var(--sp-3) var(--sp-4);
    background: var(--wn-green-deep);
    color: var(--wn-paper);
    font-weight: 600;
    text-decoration: none;
    border-radius: var(--r-sm);
    z-index: 9999;
    transition: top var(--dur-2) var(--ease-out);
  }
  .klu-skip:focus {
    top: var(--sp-5);
  }

  /* Blog-specific nav (back to home on /blog* routes) */
  .klu-blog-nav {
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 6;
  }

  .klu-blog-nav .back-home {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-4);
    background: var(--wn-paper);
    border: 2px solid var(--wn-fog);
    border-radius: var(--r-pill);
    font-family: var(--ff-text);
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--wn-graphite);
    cursor: pointer;
    transition: all var(--dur-2) var(--ease-out);
  }

  .klu-blog-nav .back-home:hover {
    border-color: var(--wn-violet);
    color: var(--wn-violet);
  }

  .klu-blog-nav .back-home:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .klu-blog-nav .back-home span {
    white-space: nowrap;
  }

  /* River strip: a sticky bar whose height is scrubbed by --klu-progress
     (0 = full-page hero S, 1 = slim sticky top bar). The "dive". */
  .klu-river {
    --hero-h: 720px;
    --compact-h: 110px;
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--wn-paper);
    height: calc(var(--hero-h) - (var(--hero-h) - var(--compact-h)) * var(--klu-progress, 0));
    min-height: var(--compact-h);
    overflow: hidden;
    isolation: isolate;
    box-shadow: 0 calc(2px * var(--klu-progress, 0)) calc(10px * var(--klu-progress, 0))
      rgba(0, 0, 0, calc(0.08 * var(--klu-progress, 0)));
    /* Short transition smooths route-change morphs without lagging scroll. */
    transition: height 150ms var(--ease-out);
  }

  .klu-river::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--klu-texture-url, none);
    background-size: cover;
    opacity: calc(0.42 * (1 - var(--klu-progress, 0)));
    pointer-events: none;
    z-index: 0;
    mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 100%);
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 100%);
  }

  /* SVG river */
  .klu-band {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  /* stroke-width + shadow opacity are scrubbed inline by --klu-progress. */
  .klu-band path.river {
    fill: none;
    stroke: var(--wn-violet);
    stroke-linecap: round;
    filter: url(#klu-soft);
    opacity: 0.92;
    vector-effect: non-scaling-stroke;
    transition: stroke-width 150ms var(--ease-out);
  }

  .klu-band path.river-shadow {
    fill: none;
    stroke: rgba(0, 0, 0, 0.15);
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    transform: translateY(4px);
    transition: stroke-width 150ms var(--ease-out),
                opacity 150ms var(--ease-out);
  }

  /* Headline + subline */
  .klu-headline {
    position: absolute;
    left: 5%;
    top: 5%;
    max-width: 11ch;
    z-index: 3;
    pointer-events: none;
    opacity: calc(1 - var(--klu-progress, 0));
    transform: translateY(calc(-12px * var(--klu-progress, 0)));
    transition: opacity 150ms var(--ease-out),
                transform 150ms var(--ease-out);
  }

  .klu-headline .eyebrow {
    color: var(--wn-violet);
    margin-bottom: 6px;
    display: block;
  }

  .klu-headline h1 {
    font-family: var(--ff-display);
    font-weight: 900;
    font-size: clamp(36px, 4.4vw, 60px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    color: var(--wn-green-deep);
    margin: 0;
  }

  .klu-subline {
    position: absolute;
    left: 5%;
    bottom: 10%;
    max-width: 26ch;
    z-index: 3;
    pointer-events: none;
    transition: opacity 320ms var(--ease-out);
  }

  .klu-subline {
    opacity: calc(1 - var(--klu-progress, 0));
  }

  .klu-subline p {
    font-size: 17px;
    line-height: 1.5;
    color: var(--wn-green-forest);
    margin: 0;
    font-weight: 500;
  }

  /* Stations */
  .klu-stations {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }

  .klu-station {
    position: absolute;
    transform: translate(-50%, -50%);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: var(--ff-display);
    font-weight: 800;
    color: var(--wn-paper);
    letter-spacing: -0.005em;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
    transition: left 420ms var(--ease-in-out),
                top 420ms var(--ease-in-out),
                gap 320ms var(--ease-in-out);
  }

  .klu-station .dot {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    transition: all var(--dur-2) var(--ease-out);
  }

  .klu-station:hover .dot {
    width: 24px;
    height: 24px;
    background: var(--wn-orange);
  }

  .klu-station[aria-expanded="true"] .dot {
    width: 32px;
    height: 32px;
    background: var(--wn-orange);
    box-shadow: 0 0 0 4px rgba(220, 109, 18, 0.3);
  }

  /* Scrollspy active state (compact mode) */
  .klu-station.active .dot {
    width: 20px;
    height: 20px;
    background: var(--wn-orange);
    box-shadow: 0 0 0 3px rgba(220, 109, 18, 0.2);
  }

  .klu-station .label {
    font-size: 15px;
    white-space: nowrap;
  }

  .klu-station:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 4px;
    border-radius: var(--r-lg);
  }

  /* Content area */
  .klu-content {
    padding: 0;
  }

  /* Mobile responsive — compact mode only on ≤ 820px */
  @media (max-width: 820px) {
    /* Mobile is always fully compact (progress = 1): a 60px strip. */
    .klu-river {
      --hero-h: 60px;
      --compact-h: 60px;
    }

    /* Hide headline, subline, and texture on mobile */
    .klu-headline,
    .klu-subline {
      display: none;
    }

    .klu-river::after {
      display: none;
    }

    /* Stations on mobile */
    .klu-station {
      gap: 8px;
    }

    .klu-station .label {
      font-size: 14px;
      padding: 4px 10px;
      background: rgba(174, 26, 110, 0.8);
      white-space: nowrap;
    }

    /* Hide content box on mobile — prose sections only */
    .klu-content {
      display: none;
    }
  }
</style>
