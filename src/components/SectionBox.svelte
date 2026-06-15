<script lang="ts">
  import type { Station } from './KlufterbachNav.svelte';

  interface Props {
    station: Station;
    onClose: () => void;
  }

  let { station, onClose }: Props = $props();

  // Placeholder content for each station (will come from CMS later)
  const stationContent = $derived(
    {
      wir: {
        title: "Wir Wunschnachbarn",
        photoCaption: "Foto · Gruppe",
        body: `
          <p>
            Eine bunte Gruppe aus Singles, Paaren, Familien, Senior:innen
            und Kindern, die ihr gemeinsames Ziel einer nachhaltigen,
            gemeinschaftlichen Lebensweise in Bonn umsetzen möchten.
          </p>
          <p>
            Seit September 2020 unterwegs. Aktuell 20 Wunschnachbarn — wir
            wachsen auf etwa 40.
          </p>
        `,
      },
      projekt: {
        title: "Zwei Bestandsgebäude",
        photoCaption: "Foto · Gebäude",
        body: `
          <p>
            Hanglage in Bonn, gute Anbindung an öffentliche Verkehrsmittel.
            Über die Bundesstraße 9 schnell zur Autobahn und in die
            umliegenden Orte. Wir bauen energieeffizient um — bezahlbar,
            nachhaltig, gemeinsam.
          </p>
        `,
      },
      ziele: {
        title: "Bezahlbar & nachhaltig",
        photoCaption: "Foto · Garten",
        body: `
          <ul>
            <li>Genossenschaft als Trägerin von bezahlbarem Wohnraum.</li>
            <li>Energieeffizienter Umbau, erneuerbare Energien.</li>
            <li>Gemeinschaftliche Nutzung von Räumen, Geräten, Fahrzeugen.</li>
            <li>Vernetzung im Stadtteil — Werkstätten, Coworking, Veranstaltungen.</li>
          </ul>
        `,
      },
      termine: {
        title: "Aktuell pausiert",
        photoCaption: "Foto · Infoabend",
        body: `
          <p>
            Aufgrund der sehr hohen Anzahl an Anfragen halten wir die
            Anwerbung neuer Wunschnachbarn vorerst aus.
          </p>
          <p>
            Wir sind aber weiterhin sehr interessiert, Dich kennenzulernen
            und werden zu gegebener Zeit neue Termine hier veröffentlichen.
          </p>
        `,
      },
      kontakt: {
        title: "Schreib uns.",
        photoCaption: "Foto · Briefkasten",
        body: `
          <p>
            Bei Fragen wende Dich gerne per Mail an uns. Wir freuen uns über
            Dein Interesse.
          </p>
          <p style="font-family: var(--ff-mono); font-size: 12px; opacity: 0.8; word-break: break-all;">
            mitmachen@wunschnachbarn.org
          </p>
          <a class="cta" href="mailto:mitmachen@wunschnachbarn.org">
            Per Mail schreiben →
          </a>
        `,
      },
    }[station.id as keyof typeof stationContent] || { title: station.label, photoCaption: "Foto", body: "<p>Inhalt folgt.</p>" }
  );
</script>

<div
  id="panel-{station.id}"
  class="klu-panel-pair"
  role="region"
  aria-labelledby="panel-{station.id}-title"
>
  <div class="klu-card">
    <button class="close" aria-label="Schließen" onclick={onClose}>×</button>
    <span class="eyebrow">{station.label}</span>
    <h2 id="panel-{station.id}-title">{stationContent.title}</h2>
    <div class="body-content">
      {@html stationContent.body}
    </div>
  </div>
  <div class="klu-photo" data-photo-slot-id="photo-{station.id}" aria-hidden="true">
    <div class="placeholder">
      <span class="kind">{stationContent.photoCaption}</span>
      <span class="hint">Bild folgt</span>
    </div>
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

  .klu-card .body-content p {
    margin-bottom: 1em;
  }

  .klu-card .body-content ul {
    padding-left: var(--sp-5);
    margin: 0 0 1em;
  }

  .klu-card .body-content li {
    margin-bottom: var(--sp-2);
  }

  .klu-card .cta {
    display: inline-flex;
    align-items: center;
    padding: var(--sp-3) var(--sp-5);
    background: var(--wn-violet);
    color: var(--wn-paper);
    text-decoration: none;
    border-radius: var(--r-pill);
    font-weight: 600;
    transition: background var(--dur-2) var(--ease-out),
                transform var(--dur-1) var(--ease-out);
  }

  .klu-card .cta:hover {
    background: #931558;
  }

  .klu-card .cta:active {
    transform: scale(0.97);
  }

  .klu-photo {
    flex: 1;
    background: var(--wn-mint-200);
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
