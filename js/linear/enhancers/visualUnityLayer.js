let formationLineQueued = false;

export function installVisualUnityLayer() {
  installClassicFormationLines();

  if (document.getElementById("visualUnityLayer")) return;

  const style = document.createElement("style");
  style.id = "visualUnityLayer";
  style.textContent = `
    :root {
      --ui-green-dark: #06130d;
      --ui-green-panel: #0b1f15;
      --ui-green-card: #10281c;
      --ui-wood: #8a5a32;
      --ui-wood-dark: #2b180d;
      --ui-cream: #f4ead6;
      --ui-muted: #c8bda8;
      --ui-gold: #d1b36e;
    }

    body {
      color: var(--ui-cream) !important;
      background:
        radial-gradient(circle at 16% 0%, rgba(242, 204, 107, .13), transparent 27%),
        radial-gradient(circle at 88% 9%, rgba(138, 90, 50, .18), transparent 31%),
        linear-gradient(180deg, #06130d, #0b1f15 45%, #050b08) !important;
      background-attachment: fixed !important;
    }

    @media (max-width: 760px) {
      body {
        background:
          repeating-linear-gradient(90deg, rgba(240, 223, 184, .1) 0 1px, transparent 1px 24px),
          repeating-linear-gradient(90deg, rgba(138, 90, 50, .17) 0 2px, transparent 2px 48px),
          radial-gradient(circle at 16% 0%, rgba(242, 204, 107, .13), transparent 27%),
          radial-gradient(circle at 88% 9%, rgba(138, 90, 50, .18), transparent 31%),
          linear-gradient(180deg, #06130d, #0b1f15 45%, #050b08) !important;
        background-attachment: fixed !important;
      }
    }

    body::before {
      content: "" !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 0 !important;
      pointer-events: none !important;
      background:
        linear-gradient(90deg, rgba(242, 204, 107, .11), transparent 16%, transparent 84%, rgba(138, 90, 50, .12)),
        linear-gradient(90deg, rgba(240,223,184,.13) 0 1px, transparent 1px 78px, rgba(90,53,30,.18) 78px 80px, transparent 80px 156px) left top / 156px 100% repeat-x !important;
      opacity: .58 !important;
      mask-image: linear-gradient(90deg, #000 0%, #000 18%, transparent 34%, transparent 66%, #000 82%, #000 100%);
      -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 18%, transparent 34%, transparent 66%, #000 82%, #000 100%);
    }

    #app {
      position: relative !important;
      z-index: 1 !important;
    }

    /* Prevent grid containers with no explicit column track from growing
       to fit uncompressible content (e.g. a fixed-width pitch/formation
       row) wider than the viewport - forces them to shrink instead. */
    .linear-card,
    .linear-draft-view,
    .linear-my-team-view,
    .linear-s11-view,
    .linear-tactics-view,
    .linear-player-list-view,
    .linear-ai-teams-view {
      grid-template-columns: minmax(0, 1fr) !important;
      min-width: 0 !important;
    }

    @media (max-width: 480px) {
      .linear-info-card-view.linear-info-card-view .compact-player-line,
      .linear-info-card-view.linear-info-card-view .linear-pitch-line {
        flex-wrap: nowrap !important;
      }
    }

    .linear-card.linear-card,
    .hero-card.hero-card,
    .live-momentum-card.live-momentum-card,
    .live-stats-panel.live-stats-panel,
    .live-ticker-card.live-ticker-card,
    .linear-draft-view.linear-draft-view,
    .linear-draft-tabs.linear-draft-tabs,
    .linear-round-picks.linear-round-picks,
    .linear-order-ticker.linear-order-ticker,
    .linear-speed-box.linear-speed-box {
      color: var(--ui-cream) !important;
      border: 1.5px solid var(--ui-wood) !important;
      border-radius: 22px !important;
      outline: 1px solid rgba(209,179,110,.5) !important;
      outline-offset: -4px !important;
      background: linear-gradient(180deg, rgba(244,234,214,.035), rgba(0,0,0,.08)), linear-gradient(145deg, rgba(15,40,27,.96), rgba(7,18,12,.98) 64%, rgba(32,18,8,.94)) !important;
      box-shadow: inset 0 0 0 1px rgba(244,234,214,.08), inset 0 0 34px rgba(0,0,0,.38), 0 20px 54px rgba(0,0,0,.52) !important;
    }

    .live-scoreboard.live-scoreboard,
    .live-controls.live-controls {
      border: none !important;
      outline: none !important;
      background: none !important;
      box-shadow: none !important;
    }

    .linear-player-card.linear-player-card,
    .draft-list-player-card.draft-list-player-card,
    .linear-info-player-card.linear-info-player-card,
    .linear-slot.linear-slot,
    .compact-slot.compact-slot,
    .season-row.season-row,
    .schedule-row.schedule-row,
    .division-team.division-team {
      color: var(--ui-cream) !important;
      border-color: rgba(90,50,27,.95) !important;
      background: linear-gradient(145deg, #0e2519, #07120c 68%, #1c1008) !important;
      box-shadow: inset 0 0 0 1px rgba(244,234,214,.06), 0 12px 30px rgba(0,0,0,.34) !important;
    }

    .live-ticker-event.live-ticker-event {
      color: var(--ui-cream) !important;
      box-shadow: inset 0 0 0 1px rgba(244,234,214,.06), 0 12px 30px rgba(0,0,0,.34) !important;
    }

    .draft-list-rating,
    .draft-list-position,
    .linear-player-top strong,
    .linear-player-top b,
    .linear-info-rating,
    .linear-info-position,
    .live-stat-value,
    .live-clock,
    .eyebrow,
    .bench-title,
    #pickInfo {
      color: var(--ui-gold) !important;
      text-shadow: none !important;
    }

    .linear-player-name,
    .draft-list-name,
    .linear-info-name,
    h1,
    h2,
    h3 {
      color: var(--ui-cream) !important;
    }

    .subtitle,
    .hint,
    .draft-list-club,
    .draft-list-nationality,
    .player-meta,
    .linear-info-meta span {
      color: var(--ui-muted) !important;
    }

    .main-tab.main-tab,
    .chip.chip,
    .live-secondary-btn.live-secondary-btn,
    .linear-tab-btn.linear-tab-btn,
    .linear-draft-tabs button,
    .linear-order-ticker span,
    .linear-counter-pill {
      color: var(--ui-cream) !important;
      border-color: rgba(90,50,27,.85) !important;
      background: linear-gradient(180deg, #10281c, #07120c) !important;
      box-shadow: inset 0 0 0 1px rgba(244,234,214,.05) !important;
    }

    .main-tab.active,
    .chip.active,
    .linear-tab-btn.active,
    .linear-draft-tabs button.active,
    .linear-order-ticker span.active,
    .linear-counter-pill strong,
    .counter-number {
      color: #1b1008 !important;
      border-color: var(--ui-wood) !important;
      background: linear-gradient(180deg, #f0d48a, #c49a4e) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 8px 20px rgba(0,0,0,.28) !important;
    }

    .primary-btn.primary-btn,
    .linear-next-btn.linear-next-btn,
    .draft-btn.draft-btn,
    .live-continue-btn.live-continue-btn,
    .formation-option-btn.formation-option-btn,
    .formation-grid button {
      color: #1b1008 !important;
      border: 2px solid var(--ui-wood) !important;
      background: linear-gradient(180deg, #f0d48a, #bd9147 62%, #70441f) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 12px 28px rgba(0,0,0,.38) !important;
    }

    .linear-trait-chip,
    .draft-list-trait,
    .position-badge {
      color: var(--ui-cream) !important;
      border-color: rgba(209,179,110,.28) !important;
      background: rgba(209,179,110,.08) !important;
    }

    .eyebrow::before,
    .eyebrow::after {
      color: var(--ui-gold) !important;
    }

    /* FINAL LIVE SNAKE DRAFT OVERRIDE
       This is the last runtime style layer, so it is the correct place for the desktop draft layout. */
    @media (min-width: 901px) {
      html body .linear-draft-page.linear-page {
        width: min(1180px, calc(100% - 28px)) !important;
        padding-top: 8px !important;
      }

      html body .linear-draft-page .linear-draft-card.linear-card {
        gap: 10px !important;
        padding: 16px 18px 18px !important;
      }

      html body .linear-draft-page .linear-draft-topbar {
        min-height: 78px !important;
        height: auto !important;
        max-height: none !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 16px !important;
        padding: 8px 12px !important;
      }

      html body .linear-draft-page .linear-draft-topbar .eyebrow {
        font-size: 12px !important;
        line-height: 1 !important;
      }

      html body .linear-draft-page .linear-draft-topbar h1 {
        font-size: clamp(42px, 4vw, 54px) !important;
        line-height: .9 !important;
      }

      html body .linear-draft-page .linear-on-clock {
        font-size: 15px !important;
        line-height: 1.05 !important;
      }

      html body .linear-draft-page .linear-speed-box.linear-speed-box {
        min-width: 142px !important;
        max-width: 150px !important;
        padding: 9px 11px !important;
      }

      html body .linear-draft-page .linear-speed-box span,
      html body .linear-draft-page .linear-speed-box select {
        font-size: 13px !important;
      }

      html body .linear-draft-page .linear-speed-box select {
        min-height: 32px !important;
        height: 32px !important;
      }

      html body .linear-draft-page .linear-counter-block {
        display: grid !important;
        grid-template-columns: minmax(0, 1.15fr) minmax(360px, .85fr) !important;
        gap: 10px !important;
        min-height: 44px !important;
      }

      html body .linear-draft-page .linear-round-counter {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 10px !important;
        min-height: 44px !important;
      }

      html body .linear-draft-page .linear-counter-pill {
        min-height: 44px !important;
        height: 44px !important;
        padding: 5px 8px 5px 12px !important;
        gap: 8px !important;
      }

      html body .linear-draft-page .linear-counter-pill span {
        font-size: 11px !important;
      }

      html body .linear-draft-page .linear-counter-pill strong {
        min-width: 34px !important;
        min-height: 34px !important;
        width: 34px !important;
        height: 34px !important;
        font-size: 19px !important;
      }

      html body .linear-draft-page .linear-round-picks.linear-round-picks,
      html body .linear-draft-page .linear-order-ticker.linear-order-ticker {
        min-height: 42px !important;
        height: 42px !important;
        font-size: 14px !important;
      }

      html body .linear-draft-page .linear-order-ticker span {
        font-size: 13px !important;
        padding: 6px 12px !important;
      }

      html body .linear-draft-page .linear-draft-tabs.linear-draft-tabs {
        min-height: 52px !important;
        height: 52px !important;
        gap: 10px !important;
        padding: 7px 9px !important;
      }

      html body .linear-draft-page .linear-draft-tabs button {
        min-height: 38px !important;
        height: 38px !important;
        padding: 8px 16px !important;
        font-size: 14px !important;
      }

      html body .linear-draft-page .linear-draft-view.linear-draft-view {
        padding: 16px !important;
        gap: 12px !important;
      }

      html body .linear-draft-page .linear-player-grid {
        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        gap: 16px !important;
      }

      html body .linear-draft-page .linear-player-card.linear-player-card,
      html body .linear-draft-page .draft-list-player-card.draft-list-player-card,
      html body .linear-draft-page .player-card,
      html body .linear-draft-page .my-team-card,
      html body .linear-draft-page .linear-info-player-card.linear-info-player-card {
        outline: 1px solid rgba(217, 167, 61, .28) !important;
        outline-offset: 0 !important;
        border: 1px solid rgba(240, 223, 184, .18) !important;
        border-radius: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 8px 20px rgba(0,0,0,.30) !important;
      }

      html body .linear-draft-page .linear-player-card.linear-player-card,
      html body .linear-draft-page .draft-list-player-card.draft-list-player-card {
        min-height: 172px !important;
        padding: 14px 15px !important;
      }

      html body .linear-draft-page .draft-list-name,
      html body .linear-draft-page .linear-player-name {
        font-size: 18px !important;
        line-height: 1.12 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      html body .linear-draft-page .draft-list-club,
      html body .linear-draft-page .draft-list-nationality {
        font-size: 13px !important;
        line-height: 1.2 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function installClassicFormationLines() {
  const app = document.getElementById("app");
  if (!app) return;

  const observer = new MutationObserver(queueFormationLineEnforcement);
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener("resize", queueFormationLineEnforcement);
  queueFormationLineEnforcement();
}

function queueFormationLineEnforcement() {
  if (formationLineQueued) return;
  formationLineQueued = true;
  window.requestAnimationFrame(() => {
    formationLineQueued = false;
    enforceClassicFormationLines();
  });
}

function enforceClassicFormationLines() {
  const isMobile = window.innerWidth <= 760;

  document.querySelectorAll(".compact-player-line, .linear-pitch-line").forEach(line => {
    const slots = Array.from(line.children);
    if (!slots.length) return;

    if (!isMobile) {
      line.style.removeProperty("flex-wrap");
      slots.forEach(slot => {
        slot.style.removeProperty("width");
        slot.style.removeProperty("min-width");
        slot.style.removeProperty("max-width");
        slot.style.removeProperty("flex");
        const inner = slot.querySelector(".linear-info-player-card");
        if (inner) {
          inner.style.removeProperty("width");
          inner.style.removeProperty("min-width");
          inner.style.removeProperty("max-width");
          inner.querySelectorAll(".linear-info-name, .linear-info-meta span, .linear-info-traits small").forEach(node => {
            node.style.removeProperty("font-size");
            node.style.removeProperty("white-space");
            node.style.removeProperty("overflow");
            node.style.removeProperty("text-overflow");
          });
        }
      });
      return;
    }

    line.style.setProperty("display", "flex", "important");
    line.style.setProperty("flex-wrap", "nowrap", "important");

    const gapPx = 5;
    const available = line.clientWidth;
    if (!available) return;

    const perCard = Math.max(46, Math.floor((available - gapPx * (slots.length - 1)) / slots.length));

    slots.forEach(slot => {
      slot.style.setProperty("width", `${perCard}px`, "important");
      slot.style.setProperty("min-width", `${perCard}px`, "important");
      slot.style.setProperty("max-width", `${perCard}px`, "important");
      slot.style.setProperty("flex", `0 0 ${perCard}px`, "important");

      const inner = slot.querySelector(".linear-info-player-card");
      if (inner) {
        inner.style.setProperty("width", "100%", "important");
        inner.style.setProperty("min-width", "0", "important");
        inner.style.setProperty("max-width", "none", "important");
        fitPitchCardText(inner);
      }
    });
  });
}

function fitPitchCardText(card) {
  const name = card.querySelector(".linear-info-name");
  if (name) shrinkToFit(name, 10, 6.5);

  card.querySelectorAll(".linear-info-meta span").forEach(node => shrinkToFit(node, 9, 6));
  card.querySelectorAll(".linear-info-traits small").forEach(node => shrinkToFit(node, 8, 6));
}

function shrinkToFit(node, baseSizePx, minSizePx) {
  let size = baseSizePx;
  node.style.setProperty("font-size", `${size}px`, "important");
  node.style.setProperty("white-space", "nowrap", "important");
  node.style.setProperty("overflow", "hidden", "important");
  node.style.setProperty("text-overflow", "clip", "important");
  let guard = 20;
  while (node.scrollWidth > node.clientWidth + 0.5 && size > minSizePx && guard-- > 0) {
    size -= 0.5;
    node.style.setProperty("font-size", `${size}px`, "important");
  }
}