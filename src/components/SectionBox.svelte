<script lang="ts">
  import type { Item } from './KlufterbachNav.svelte';
  // Brand backdrop for the empty-state photo card is served from public/
  // (/assets/design-system/forest-texture.png) — same stable path used by
  // colors_and_type.css and BlogList. (R13: fixes the 404 design-system texture.)

  // Presentational only. Receives pre-rendered content; owns layout/style, not copy.
  // (SPEC R7 single source, R14 items[], R16 placement.)
  interface Props {
    id: string;
    label: string;
    title: string;
    items: Item[];
    placement?: 'below' | 'upper-right' | 'lower-left'; // R16 — reserved; only 'below' active
    onClose: () => void;
  }

  let { id, label, title, items, placement = 'below', onClose }: Props = $props();

  // First item's image fronts the photo card (single image+text today; multi-item
  // layout is deferred with the CMS items schema — SPEC §8).
  const photo = $derived(items.find((i) => i.image));
</script>

<div
  id="panel-{id}"
  class="klu-panel-pair"
  data-placement={placement}
  role="region"
  aria-labelledby="panel-{id}-title"
>
  <div class="klu-card">
    <button class="close" aria-label="Schließen" onclick={onClose}>×</button>
    <span class="eyebrow">{label}</span>
    <h2 id="panel-{id}-title">{title}</h2>
    <div class="body-content">
      {#each items as item, i (i)}
        {#if item.heading}<h3>{item.heading}</h3>{/if}
        <!-- bodyHtml is server-rendered markdown from the CMS (no client parser) -->
        {@html item.bodyHtml}
      {/each}
    </div>
  </div>
  <div class="klu-photo" data-photo-slot-id="photo-{id}">
    {#if photo}
      <img src={photo.image} alt={photo.imageAlt ?? ''} loading="lazy" />
    {:else}
      <div class="placeholder" aria-hidden="true">
        <span class="kind">{label}</span>
        <span class="hint">Bild folgt</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .klu-panel-pair {
    display: flex;
    gap: var(--sp-5);
    margin: 0 auto;
    max-width: 1100px;
    padding: var(--sp-6) var(--sp-5);
    animation: slideIn var(--dur-3) var(--ease-out);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .klu-card {
    flex: 1;
    background: var(--wn-green-deep);
    color: var(--wn-paper);
    padding: var(--sp-6);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-card-dark);
    position: relative;
    min-height: 300px;
  }

  .klu-card .close {
    position: absolute;
    top: var(--sp-4);
    right: var(--sp-4);
    background: rgba(247, 246, 241, 0.1);
    border: none;
    color: var(--wn-paper);
    font-size: 24px;
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--dur-2) var(--ease-out),
                transform var(--dur-1) var(--ease-out);
  }

  .klu-card .close:hover {
    background: rgba(247, 246, 241, 0.2);
  }

  .klu-card .close:active {
    transform: scale(0.95);
  }

  .klu-card .close:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .klu-card .eyebrow {
    display: block;
    margin-bottom: var(--sp-2);
    color: var(--wn-violet-soft);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: var(--fs-eyebrow);
    font-weight: 600;
  }

  .klu-card h2 {
    font-size: var(--fs-h3);
    margin-bottom: var(--sp-4);
    line-height: var(--lh-tight);
  }

  .klu-card .body-content {
    line-height: var(--lh-normal);
    color: rgba(247, 246, 241, 0.9);
  }

  .klu-card .body-content :global(p) {
    margin-bottom: 1em;
  }

  .klu-card .body-content :global(ul) {
    padding-left: var(--sp-5);
    margin: 0 0 1em;
  }

  .klu-card .body-content :global(li) {
    margin-bottom: var(--sp-2);
  }

  .klu-card .body-content :global(a) {
    color: var(--wn-violet-soft);
    word-break: break-all;
  }

  .klu-card .body-content :global(h3) {
    font-size: var(--fs-h4);
    margin: var(--sp-4) 0 var(--sp-2);
  }

  .klu-photo {
    flex: 1;
    background-color: var(--wn-mint-200);
    background-image: url("/assets/design-system/forest-texture.png");
    background-size: 700px auto;
    background-repeat: repeat;
    background-blend-mode: soft-light;
    border-radius: var(--r-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    overflow: hidden;
  }

  .klu-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .klu-photo .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-6);
    text-align: center;
  }

  .klu-photo .placeholder .kind {
    font-family: var(--ff-display);
    font-weight: 700;
    font-size: var(--fs-h4);
    color: var(--wn-graphite);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .klu-photo .placeholder .hint {
    font-size: var(--fs-small);
    color: var(--fg-soft);
  }

  /* Mobile responsiveness */
  @media (max-width: 820px) {
    .klu-panel-pair {
      flex-direction: column;
      gap: var(--sp-4);
      padding: var(--sp-4) var(--sp-3);
    }

    .klu-card,
    .klu-photo {
      min-height: auto;
    }
  }
</style>
