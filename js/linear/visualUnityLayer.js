export function installVisualUnityLayer() {
  if (document.getElementById("visualUnityLayer")) return;

  const style = document.createElement("style");
  style.id = "visualUnityLayer";
  style.textContent = `
    :root {
      --ui-green-dark: #06130d;
      --ui-green-panel: #0b1f15;
      --ui-green-card: #10281c;
      --ui-wood: #5a321b;
      --ui-wood-dark: #2b180d;
      --ui-cream: #f4ead6;
      --ui-muted: #c8bda8;
      --ui-gold: #d1b36e;
    }

    body {
      color: var(--ui-cream) !important;
      background: linear-gradient(180deg, #06130d, #0b1f15 45%, #050b08) !important;
    }

    .linear-card.linear-card,
    .hero-card.hero-card,
    .live-scoreboard.live-scoreboard,
    .live-momentum-card.live-momentum-card,
    .live-stats-panel.live-stats-panel,
    .live-ticker-card.live-ticker-card,
    .live-controls.live-controls,
    .linear-draft-view.linear-draft-view,
    .linear-draft-tabs.linear-draft-tabs,
    .linear-round-picks.linear-round-picks,
    .linear-order-ticker.linear-order-ticker,
    .linear-speed-box.linear-speed-box {
      color: var(--ui-cream) !important;
      border: 4px solid var(--ui-wood) !important;
      border-radius: 22px !important;
      outline: 1px solid rgba(209,179,110,.55) !important;
      outline-offset: -8px !important;
      background: linear-gradient(180deg, rgba(244,234,214,.035), rgba(0,0,0,.08)), linear-gradient(145deg, #0f281b, #07120c 64%, #201208) !important;
      box-shadow: inset 0 0 0 1px rgba(244,234,214,.08), inset 0 0 34px rgba(0,0,0,.38), 0 20px 54px rgba(0,0,0,.52) !important;
    }

    .linear-player-card.linear-player-card,
    .draft-list-player-card.draft-list-player-card,
    .linear-info-player-card.linear-info-player-card,
    .linear-slot.linear-slot,
    .compact-slot.compact-slot,
    .season-row.season-row,
    .schedule-row.schedule-row,
    .division-team.division-team,
    .live-ticker-event.live-ticker-event {
      color: var(--ui-cream) !important;
      border-color: rgba(90,50,27,.95) !important;
      background: linear-gradient(145deg, #0e2519, #07120c 68%, #1c1008) !important;
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
      border: 3px solid var(--ui-wood) !important;
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
  `;
  document.head.appendChild(style);
}
