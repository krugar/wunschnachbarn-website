<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import SectionBox from './SectionBox.svelte';

  // Type definition for stations
  export type Station = {
    id: string;
    label: string;
    t: number;
    x?: number;
    y?: number;
    isRoute?: boolean;
    route?: string;
  };

  // Station definitions — same as prototype but adjusted for Svelte 5
  const STATIONS: Station[] = [
    {
      id: "wir",
      label: "Wir",
      t: 0.08,
    },
    {
      id: "projekt",
      label: "Projekt",
      t: 0.22,
    },
    {
      id: "ziele",
      label: "Ziele",
      t: 0.38,
    },
    {
      id: "blog",
      label: "Blog",
      t: 0.55,
      isRoute: true,
      route: "/blog",
    },
    {
      id: "termine",
      label: "Termine",
      t: 0.72,
    },
    {
      id: "kontakt",
      label: "Kontakt",
      t: 0.89,
    },
  ];

  // CORRECTED river path from handoff: top-left → bottom-right descent
  // Original prototype path: "M -50 240 Q 320 420 640 320 T 1330 400"
  const RIVER_D = "M -60 120 Q 360 230 660 360 T 1340 640";

  // State: which content box is open (null = none)
  let activeStationId = $state<string | null>(null);

  // State: station positions computed from path
  let stations = $state(
    STATIONS.map(s => ({ ...s, x: 0, y: 0 }))
  );

  // State: mobile breakpoint
  let isMobile = $state(false);

  // State: scroll position (for home page morph trigger)
  let scrollY = $state(0);

  // State: current route (for compact state on /blog*)
  let currentRoute = $state(typeof window !== 'undefined' ? window.location.pathname : '/');

  // State: which prose section is currently in view (for scrollspy)
  let activeScrollSection = $state<string | null>(null);

  // Refs
  let pathEl: SVGPathElement | null = null;
  let pageEl: HTMLElement | null = null;

  // Computed: is there an active station
  const hasActiveStation = $derived(activeStationId !== null);

  // Computed: should be in compact mode?
  // Compact if: (has active content box) OR (on /blog* routes) OR (scrolled past hero on home)
  const isCompact = $derived(
    hasActiveStation ||
    currentRoute.startsWith('/blog') ||
    (currentRoute === '/' && scrollY > 400)
  );

  // Track scroll position
  function handleScroll() {
    scrollY = window.scrollY;
  }

  // Handle route changes (View Transitions client-side navigation)
  function handleRouteChange() {
    const newRoute = window.location.pathname;
    currentRoute = newRoute;

    // Reset scroll position when route changes
    scrollY = window.scrollY;

    // Update URL hash if a station is active
    if (activeStationId && !newRoute.startsWith('/blog')) {
      window.history.replaceState(null, '', `#${activeStationId}`);
    }

    // Reset scrollspy active section
    activeScrollSection = null;
  }

  // Scrollspy: detect which prose section is in view
  function updateScrollspy() {
    if (!isCompact || currentRoute !== '/') return;

    const sections = document.querySelectorAll('.section-prose');
    let currentSection: string | null = null;
    let minDistance = Infinity;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top);

      // Consider section "active" if it's within 40% of viewport
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= 0) {
        const sectionId = section.id;
        // Find the closest section within the active zone
        if (distance < minDistance) {
          minDistance = distance;
          currentSection = sectionId;
        }
      }
    });

    if (currentSection) {
      activeScrollSection = currentSection;
    }
  }

  // Handle station click
  function handleStationClick(stationId: string) {
    const station = STATIONS.find(s => s.id === stationId);
    if (!station) return;

    if (station.isRoute) {
      // Blog station: navigate to route
      navigate(station.route);
      return;
    }

    // In compact mode: scroll to prose section
    if (isCompact) {
      const section = document.getElementById(stationId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        // Update URL hash
        window.history.replaceState(null, '', `#${stationId}`);
      }
      return;
    }

    // In hero mode: toggle content box
    if (activeStationId === stationId) {
      activeStationId = null; // Close if already open
    } else {
      activeStationId = stationId; // Open new station
    }
  }

  // Close active station (e.g., from close button or Esc key)
  function closeActiveStation() {
    activeStationId = null;
  }

  // Navigate back to home
  function navigateToHome() {
    navigate('/');
  }

  // Compute station positions from SVG path

  // Compute station positions from SVG path
  function computeStationPositions() {
    if (!pathEl || isMobile) return;

    const totalLength = pathEl.getTotalLength();
    stations = STATIONS.map(s => {
      const point = pathEl.getPointAtLength(s.t * totalLength);
      return { ...s, x: point.x, y: point.y };
    });
  }

  // Check mobile breakpoint
  function checkMobile() {
    isMobile = window.matchMedia("(max-width: 820px)").matches;
  }

  // Initialize on mount
  onMount(() => {
    // Check initial route now that window is available
    currentRoute = window.location.pathname;

    checkMobile();
    computeStationPositions();

    // Listen for resize for mobile breakpoint
    const mediaQuery = window.matchMedia("(max-width: 820px)");
    mediaQuery.addEventListener("change", checkMobile);

    // Listen for scroll (only on home page)
    if (currentRoute === '/') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('scroll', updateScrollspy, { passive: true });
    }

    // Listen for route changes (View Transitions navigation)
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('astro:page-load', handleRouteChange);

    // Listen for hash changes (for deep linking)
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && STATIONS.find(s => s.id === hash)) {
        activeStationId = hash;
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Check initial hash

    // Listen for keyboard (Esc to close)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeStationId) {
        closeActiveStation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", checkMobile);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', updateScrollspy);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('astro:page-load', handleRouteChange);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<div class="klu-page" data-compact={isCompact ? "true" : "false"} bind:this={pageEl}>
  <a href="#main" class="klu-skip">Zum Inhalt springen</a>

  {#if currentRoute.startsWith('/blog')}
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
      <path class="river-shadow" d={RIVER_D} />
      <path
        class="river"
        bind:this={pathEl}
        d={RIVER_D}
        stroke="url(#klu-grad)"
      />
    </svg>

    <div class="klu-headline" aria-hidden={isCompact ? "true" : undefined}>
      <span class="eyebrow">Wohngenossenschaft · Bonn</span>
      <h1>Gemeinschaft am Klufterbach.</h1>
    </div>

    <div class="klu-subline" aria-hidden={isCompact ? "true" : undefined}>
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
          class:active={activeScrollSection === station.id && !station.isRoute}
          style:left={!isMobile && isCompact ? `${(i / (STATIONS.length - 1)) * 84 + 8}%` : `${(station.x / 1280) * 100}%`}
          style:top={!isMobile && isCompact ? "50%" : `${(station.y / 720) * 100}%`}
          aria-expanded={activeStationId === station.id}
          aria-controls={!station.isRoute ? `panel-${station.id}` : undefined}
          onclick={() => handleStationClick(station.id)}
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">{station.label}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Content area for static station boxes -->
  <main class="klu-content" aria-live="polite">
    {#if activeStationId && !STATIONS.find(s => s.id === activeStationId)?.isRoute}
      <SectionBox
        station={STATIONS.find(s => s.id === activeStationId)!}
        onClose={closeActiveStation}
      />
    {/if}
  </main>
</div>

<style>
  .klu-page {
    background: var(--wn-paper);
    min-height: 100vh;
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

  /* River strip (morphs from full-page S to header bar) */
  .klu-river {
    position: relative;
    height: 720px;
    min-height: 720px;
    transition: height 420ms var(--ease-in-out),
                min-height 420ms var(--ease-in-out);
    overflow: hidden;
    isolation: isolate;
  }

  .klu-page[data-compact="true"] .klu-river {
    height: 110px;
    min-height: 110px;
  }

  .klu-river::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("/assets/design-system/forest-texture.png");
    background-size: 1200px auto;
    background-repeat: repeat;
    opacity: 0.12;
    pointer-events: none;
    z-index: 0;
    mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 100%);
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 100%);
    transition: opacity 420ms var(--ease-in-out);
  }

  .klu-page[data-compact="true"] .klu-river::after {
    opacity: 0;
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

  .klu-band path.river {
    fill: none;
    stroke: var(--wn-violet);
    stroke-width: 96;
    stroke-linecap: round;
    filter: url(#klu-soft);
    opacity: 0.92;
    vector-effect: non-scaling-stroke;
    transition: stroke-width 420ms var(--ease-in-out);
  }

  .klu-band path.river-shadow {
    fill: none;
    stroke: rgba(0, 0, 0, 0.15);
    stroke-width: 96;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    transform: translateY(4px);
    transition: stroke-width 420ms var(--ease-in-out),
                opacity 320ms var(--ease-out);
  }

  .klu-page[data-compact="true"] .klu-band path.river {
    stroke-width: 38;
  }

  .klu-page[data-compact="true"] .klu-band path.river-shadow {
    stroke-width: 38;
    opacity: 0;
  }

  /* Headline + subline */
  .klu-headline {
    position: absolute;
    left: 5%;
    top: 5%;
    max-width: 11ch;
    z-index: 3;
    pointer-events: none;
    transition: opacity 320ms var(--ease-out),
                transform 420ms var(--ease-in-out);
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

  .klu-subline p {
    font-size: 17px;
    line-height: 1.5;
    color: var(--wn-green-forest);
    margin: 0;
    font-weight: 500;
  }

  .klu-page[data-compact="true"] .klu-headline,
  .klu-page[data-compact="true"] .klu-subline {
    opacity: 0;
    transform: translateY(-12px);
    pointer-events: none;
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
    min-height: 400px;
  }

  /* Mobile responsive (will refine in Phase 5) */
  @media (max-width: 820px) {
    .klu-river {
      height: 100vh;
      min-height: 100vh;
    }

    .klu-station {
      gap: 8px;
    }

    .klu-station .label {
      font-size: 16px;
    }
  }
</style>
